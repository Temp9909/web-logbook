import { useCallback, useEffect, useRef } from 'react';
import SignaturePad from 'signature_pad';
// MUI
// Custom
import ApplePanel from "../../UIElements/ApplePanel";
import ClearSignatureButton from "./ClearSignatureButton";
import PickColorButton from "./PickColorButton";
import SaveSignatureButton from "./SaveSignatureButton";
import UploadSignatureButton from "./UploadSignatureButton";

const ActionButtons = ({ settings, handleChange }) => (
  <>
    <UploadSignatureButton handleChange={handleChange} />
    <SaveSignatureButton settings={settings} />
    <ClearSignatureButton handleChange={handleChange} />
    <PickColorButton handleChange={handleChange} />
  </>
);

export const LogbookSignature = ({ settings, handleChange }) => {
  const canvasRef = useRef(null);
  const signaturePadRef = useRef(null);
  const penColor = settings?.penColor || '#000000'; // Default color: black

  const handleSave = useCallback(() => {
    if (signaturePadRef.current?.isEmpty()) {
      return;
    }
    const dataUrl = signaturePadRef.current.toDataURL();
    handleChange('signature_image', dataUrl);
  }, [handleChange]);


  useEffect(() => {
    const canvas = canvasRef.current;
    signaturePadRef.current = new SignaturePad(canvas, { penColor });

    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext('2d').scale(ratio, ratio);
      signaturePadRef.current.clear(); // Otherwise, isEmpty() might return incorrect value
    };

    // Initial resize
    resizeCanvas();

    // Load existing signature if available
    if (settings.signature_image) {
      signaturePadRef.current.fromDataURL(settings.signature_image);
    }

    window.addEventListener('resize', resizeCanvas);
    signaturePadRef.current.addEventListener("endStroke", handleSave);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
        signaturePadRef.current.removeEventListener("endStroke", handleSave);
      }
    };
  }, [handleSave, penColor, settings.signature_image]);

  // Update pen color when user selects a new color
  useEffect(() => {
    if (signaturePadRef.current) {
      signaturePadRef.current.penColor = settings.penColor;
    }
  }, [settings.penColor]);


  return (
    <ApplePanel
      title="Logbook signature"
      subtitle="Draw or upload the signature used on signed records."
      actions={<ActionButtons settings={settings} handleChange={handleChange} />}
    >
      <div className="apple-signature-pad">
        <canvas ref={canvasRef} className="apple-signature-canvas" />
      </div>
    </ApplePanel>
  );
};

export default LogbookSignature;
