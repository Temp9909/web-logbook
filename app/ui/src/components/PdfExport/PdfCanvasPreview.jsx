import { useEffect, useRef, useState } from 'react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const MAX_RENDER_DPR = 1.5;

function PdfCanvasPage({ pdf, pageNumber, pageRatio, scrollRoot, onError }) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const updateWidth = () => setWidth(Math.max(1, Math.floor(host.clientWidth)));
    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(host);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const root = scrollRoot.current;
    if (!host || !root) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setIsNearViewport(entry.isIntersecting),
      { root, rootMargin: '900px 0px' },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [scrollRoot]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isNearViewport || width <= 1) return undefined;

    let cancelled = false;
    const render = async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;
        const naturalViewport = page.getViewport({ scale: 1 });
        const cssScale = width / naturalViewport.width;
        const renderDpr = Math.min(window.devicePixelRatio || 1, MAX_RENDER_DPR);
        const renderViewport = page.getViewport({ scale: cssScale * renderDpr });
        const context = canvas.getContext('2d', { alpha: false });

        canvas.width = Math.max(1, Math.floor(renderViewport.width));
        canvas.height = Math.max(1, Math.floor(renderViewport.height));
        canvas.style.width = `${width}px`;
        canvas.style.height = `${Math.round(naturalViewport.height * cssScale)}px`;

        renderTaskRef.current = page.render({ canvasContext: context, viewport: renderViewport });
        await renderTaskRef.current.promise;
        renderTaskRef.current = null;
      } catch (error) {
        if (!cancelled && error?.name !== 'RenderingCancelledException') onError(error);
      }
    };

    render();
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
    };
  }, [isNearViewport, onError, pageNumber, pdf, width]);

  useEffect(() => {
    if (isNearViewport || !canvasRef.current) return;
    canvasRef.current.width = 1;
    canvasRef.current.height = 1;
  }, [isNearViewport]);

  return (
    <div
      ref={hostRef}
      className="exact-pdf-canvas-page"
      style={{ aspectRatio: `1 / ${pageRatio}` }}
      aria-label={`PDF page ${pageNumber}`}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}

export default function PdfCanvasPreview({ src }) {
  const scrollRoot = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [pageRatio, setPageRatio] = useState(210 / 297);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!src) return undefined;
    let cancelled = false;
    const loadingTask = getDocument(src);

    loadingTask.promise
      .then(async (document) => {
        const firstPage = await document.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1 });
        if (cancelled) {
          document.destroy();
          return;
        }
        setPageRatio(viewport.height / viewport.width);
        setPdf(document);
        setError(null);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError);
      });

    return () => {
      cancelled = true;
      loadingTask.destroy();
    };
  }, [src]);

  if (error) {
    return <div className="note exact-preview-error">Could not display the PDF preview.</div>;
  }

  return (
    <div ref={scrollRoot} className="exact-pdf-canvas-preview">
      {!pdf ? <div className="exact-pdf-canvas-loading">Preparing PDF pages…</div> : null}
      {pdf ? Array.from({ length: pdf.numPages }, (_, index) => (
        <PdfCanvasPage
          key={index + 1}
          pdf={pdf}
          pageNumber={index + 1}
          pageRatio={pageRatio}
          scrollRoot={scrollRoot}
          onError={setError}
        />
      )) : null}
    </div>
  );
}
