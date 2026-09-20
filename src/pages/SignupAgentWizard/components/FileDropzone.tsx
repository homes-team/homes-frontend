import { ChangeEvent } from 'react';
import { Field, Label } from '../../../components/ui/Field';

interface FileDropzoneProps {
  label: string;
  required: boolean;
  helper: string;
  file: File | null;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

function FileDropzone({ label, required, helper, file, onChange }: FileDropzoneProps) {
  return (
    <Field>
      <Label>{required ? `${label} *` : `${label} (선택)`}</Label>
      <label
        className={`flex flex-col items-center gap-1.5 rounded-[10px] border border-dashed p-6 text-center ${
          file ? 'border-primary bg-primary-50' : 'border-gray-200 bg-white'
        }`}
      >
        <span aria-hidden="true">📄</span>
        {file ? (
          <span className="text-[13px] font-bold break-all text-gray-900">{file.name}</span>
        ) : (
          <span className="text-[13px] font-medium text-primary">클릭해서 이미지 업로드</span>
        )}
        <span className="text-[11px] text-gray-500">{helper}</span>
        <input type="file" accept="image/*" onChange={onChange} className="hidden" />
      </label>
    </Field>
  );
}

export default FileDropzone;
