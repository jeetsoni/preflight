'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Interactive 3D viewer for STEP models. The OpenCascade kernel (occt-import-js) and the
 * online-3d-viewer engine are imported only after mount, so they stay out of first paint and
 * load only when a model is actually present.
 */
export default function ModelViewer({ file }: { file: File }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let viewer: import('online-3d-viewer').EmbeddedViewer | null = null;
    let observer: ResizeObserver | null = null;

    (async () => {
      try {
        const OV = await import('online-3d-viewer');
        if (cancelled || !hostRef.current) return;
        viewer = new OV.EmbeddedViewer(hostRef.current, {
          backgroundColor: new OV.RGBAColor(244, 248, 248, 255),
          defaultColor: new OV.RGBColor(148, 160, 168),
          edgeSettings: new OV.EdgeSettings(true, new OV.RGBColor(38, 46, 52), 1),
          onModelLoadFailed: () => {
            if (!cancelled) setFailed(true);
          },
        });
        viewer.LoadModelFromFileList([file]);
        observer = new ResizeObserver(() => viewer?.Resize());
        observer.observe(hostRef.current);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      observer?.disconnect();
      try {
        viewer?.Destroy();
      } catch {
        /* viewer already torn down */
      }
      // Remove the canvas/progress nodes the engine appended (also guards StrictMode remounts).
      host.replaceChildren();
    };
  }, [file]);

  return (
    <div className="pf-viewer-wrap">
      <div ref={hostRef} className="pf-viewer" />
      {failed && (
        <div className="pf-viewer-error">
          Couldn&apos;t render this model in 3D — the geometry kernel may not support a feature in
          this file.
        </div>
      )}
      <div className="pf-viewer-hint">drag to rotate · scroll to zoom · right-drag to pan</div>
    </div>
  );
}
