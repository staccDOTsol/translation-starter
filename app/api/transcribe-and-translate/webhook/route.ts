import { NextResponse } from 'next/server';

export async function OPTIONS(req: Request) {
  console.log('transcribe-and-translate webhook - options');
  const data = await req.text();
  return new Response(JSON.stringify({ data }), {
    status: 200
  });
}

export async function POST(req: Request) {
  console.log('transcribe-and-translate webhook - post');
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      headers: { Allow: 'POST' },
      status: 405
    });
  }

  const result = await req.json();

  if (!result) {
    return new Response(JSON.stringify({ error: { statusCode: 500 } }), {
      status: 500
    });
  }
  console.log('result: ', result);

  const transcript = result.payload.prediction;

  console.log('transcript: ', transcript);

  const transalatedText = transcript
    .map((item: { transcription: string }) => item.transcription.trim())
    .join(' ');

  console.log('transalatedText: ', transalatedText);
  const updateJobResponse = await fetch(
    `${
      process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    }/api/db/update-job-by-transcription-id`,
    {
      method: 'POST',
      body: JSON.stringify({
        transcriptionId: result.request_id,
        updatedFields: {
          transcript,
          source_language: transcript[0].language,
          translated_text: transalatedText
        }
      })
    }
  );

  if (!updateJobResponse.ok) {
    console.error(
      `Failed to update job status: ${updateJobResponse.status} ${updateJobResponse.statusText}`
    );
    return NextResponse.json({
      success: false,
      message: `Failed to update job status: ${updateJobResponse.status} ${updateJobResponse.statusText}`
    });
  }

  return NextResponse.json({ success: true });
}
