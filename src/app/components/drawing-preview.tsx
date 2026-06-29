'use client';

import { useEffect, useState } from 'react';

/** Inline preview of the uploaded drawing — raster images as <img>, PDFs in an <iframe>. */
export default function DrawingPreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!url) return <div className="pf-drawing-img-wrap" />;

  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (isPdf) {
    return (
      <iframe
        title="Drawing preview"
        src={`${url}#toolbar=0&navpanes=0&view=FitH`}
        className="pf-drawing-frame"
      />
    );
  }
  return (
    <div className="pf-drawing-img-wrap">
      {/* eslint-disable-next-line @next/next/no-img-element -- blob object URL, not optimizable by next/image */}
      <img alt="Drawing preview" src={url} className="pf-drawing-img" />
    </div>
  );
}
