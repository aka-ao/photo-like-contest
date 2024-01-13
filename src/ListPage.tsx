import {
  getDownloadURL,
  getStorage,
  listAll,
  ref,
  uploadBytes,
} from "firebase/storage";
import React, { useEffect, useRef, useState } from "react";
import { storage } from "./firebase";

import "./ListPage.css"; // CSSをインポート
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import SendIcon from "@mui/icons-material/Send";
import { Snackbar } from "@mui/material";

const ListPage = () => {
  const [images, setImages] = useState<string[]>([]);
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
  const [isNoFileSnackbarOpen, setIsNoFileSnackbarOpen] = useState(false);

  const fetchImages = async () => {
    const storageRef = ref(storage, "images/");
    const result = await listAll(storageRef);
    const sorted  = result.items.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      return 1;
    });
    const urlPromises = sorted.map((imageRef) =>
      getDownloadURL(imageRef)
    );

    const urls = await Promise.all(urlPromises);
    setImages(urls);
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const files = fileInputRef.current?.files;
    if (!files || files.length == 0) {
      setIsNoFileSnackbarOpen(true);
      return;
    }

    const storage = getStorage();
    const storageRef = ref(storage, "images/");
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileRef = ref(storageRef, `${file.name}}`);
      await uploadBytes(fileRef, file);
      console.log(`${file.name}をアップロードしました`);
    }
    console.log("アップロード完了");
    setIsSnackbarOpen(true);
    // アップロード後にフォームをリセットする
    fileInputRef.current.value = "";

  fetchImages();
  };

  const handleSnackbarClose = () => {
    setIsSnackbarOpen(false);
    setIsNoFileSnackbarOpen(false);
  };

  return (
    <div className="list-page">
      <div className="image-grid">
        {images.map((url, index) => (
          <div key={index} className="image-item">
            <img src={url} alt="" />
          </div>
        ))}
      </div>
      <div className="upload-form">
        <form onSubmit={handleFormSubmit}>
          <input
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            style={{ display: "none" }}
          />
          <div className="icon-container">
            <IconButton onClick={handleAddButtonClick}>
              <AddIcon />
            </IconButton>
            <IconButton type="submit">
              <SendIcon />
            </IconButton>
          </div>
        </form>
      </div>
      <Snackbar
        open={isSnackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message="写真のアップロードが完了しました"
      />
      <Snackbar
        open={isNoFileSnackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message="ファイルが選択されていません"
      />
    </div>
  );
};

export default ListPage;
