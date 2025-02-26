import { useState } from "react";

const FileUpload = ({ onUpload }) => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      onUpload(uploadedFile);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
      {file && <p>Uploaded: {file.name}</p>}
    </div>
  );
};

export default FileUpload;
