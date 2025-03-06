import { useState } from "react";
//import * as XLSX from "xlsx";
//import { uploadToFirebase } from "@/utils/firebaseUtils"; // Import your Firebase function

const Dropbox = () => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      processExcelFile(uploadedFile);
    }
  };

  const processExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      
      //console.log(jsonData); 
      uploadToFirebase(jsonData); // Save data to Firebase
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-4 border rounded-lg">
      <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
      {file && <p>Uploaded: {file.name}</p>}
    </div>
  );
};

export default Dropbox;

