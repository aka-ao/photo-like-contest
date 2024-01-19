import {
  getDownloadURL,
  getStorage,
  listAll,
  ref,
  uploadBytes,
} from "firebase/storage";
import { ref as dbRef, get, push } from "firebase/database";
import React, { useEffect, useRef, useState } from "react";
import { database, storage } from "./firebase";

import AddIcon from "@mui/icons-material/Add";
import SendIcon from "@mui/icons-material/Send";
import { Snackbar } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import FavoriteIcon from "@mui/icons-material/Favorite";
import "./ListPage.css"; // CSSをインポート
import { set } from "firebase/database";

const ListPage = () => {
  const [images, setImages] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]); // お気に入りの画像のURLを格納する配列
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
  const [isNoFileSnackbarOpen, setIsNoFileSnackbarOpen] = useState(false);
  const [errorState, setErrorState] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const uploadFormContainerRef = useRef<HTMLDivElement>(null);

  const fetchImages = async () => {
    try {
      const storageRef = ref(storage, "images/");
      const result = await listAll(storageRef);
      const sorted = result.items.sort((a, b) => {
        if (a.name < b.name) {
          return -1;
        }
        return 1;
      });
      const urlPromises = sorted.map((imageRef) => getDownloadURL(imageRef));

      const urls = await Promise.all(urlPromises);
      setImages(urls);
    } catch (error) {
      console.log(error);
      setErrorState(true);
      setErrorMessage("画像を取得できませんでした。");
    }
  };
  const fetchFavorites = async () => {
    const userFavoritesRef = dbRef(database, "userFavorites/test_user");
    const fav: string[] = [];
    await get(userFavoritesRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        for (const key in data) {
          fav.push(data[key].url);
        }
      } else {
        console.log("No data available");
      }
    })
    .catch((error) => {
      console.error(error);
    });
    setFavorites(fav);
  }

  useEffect(() => {
    fetchImages();
    fetchFavorites();
    if (uploadFormContainerRef.current) {
    const marginBottom = `${uploadFormContainerRef.current.offsetHeight}px`;
    const imageGrid = document.querySelector('.image-grid');
    if (imageGrid) {
      const imageGrid = document.querySelector('.image-grid') as HTMLElement;
      imageGrid.style.marginBottom = marginBottom;
    }
  }
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    try {
      event.preventDefault();
      const files = fileInputRef.current?.files;
      if (!files || files.length === 0) {
        setIsNoFileSnackbarOpen(true);
        return;
      }

      const storage = getStorage();
      const storageRef = ref(storage, "images/");
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileRef = ref(storageRef, `${file.name}`);
        await uploadBytes(fileRef, file);
        console.log(`${file.name}をアップロードしました`);
      }
      console.log("アップロード完了");
      setIsSnackbarOpen(true);
      // アップロード後にフォームをリセットする
      fileInputRef.current.value = "";

      fetchImages();
    } catch (error) {
      console.log(error);
      setErrorState(true);
      setErrorMessage("画像のアップロードに失敗しました。");
    }
  };

  const handleFavoriteButtonClick = async(url: string, username: string) => {
    if (!favorites.includes(url)) {
      const userFavoritesRef = dbRef(database, "userFavorites/" + username);
      push(userFavoritesRef, {
        url: url,
      });
      await fetchFavorites();
      console.log("お気に入りに追加");
      return;
    }
    console.log("お気に入りから削除");
    const userFavoritesRef = dbRef(database, "userFavorites/" + username);
    await get(userFavoritesRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          for (const key in data) {
            if (data[key].url === url) {
              const deleteRef = dbRef(database, "userFavorites/" + username + "/" + key);
              set(deleteRef, {});
            }
          }
        } else {
          console.log("No data available");
        }
      })
      .catch((error) => {
        console.error(error);
      });
    await fetchFavorites(); // お気に入り削除後にお気に入りを再取得
  };

  const handleSnackbarClose = () => {
    setIsSnackbarOpen(false);
    setIsNoFileSnackbarOpen(false);
    setErrorState(false);
    setErrorMessage("");
  };

  return (
    <div className="list-page">
      <div className="image-grid">
        {images.map((image, index) => (
          <div key={index} className="image-item">
            <img src={image} alt="" loading="lazy" />
            <IconButton
              className="like-icon"
              onClick={async() => handleFavoriteButtonClick(image, "test_user")}
            >
              <FavoriteIcon style={{ color: favorites.includes(image) ? 'red' : 'grey' }} />
            </IconButton>
          </div>
        ))}
      </div>
      <div className="upload-form-container" ref={uploadFormContainerRef}>
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
      <Snackbar
        open={errorState}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={errorMessage}
      />
    </div>
  );
};

export default ListPage;
