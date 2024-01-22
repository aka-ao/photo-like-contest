import { ref as dbRef, get, push } from "firebase/database";
import {
  getDownloadURL,
  getStorage,
  listAll,
  ref,
  uploadBytes,
} from "firebase/storage";
import React, { useEffect, useRef, useState } from "react";
import { database, storage } from "./firebase";

import AddIcon from "@mui/icons-material/Add";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SendIcon from "@mui/icons-material/Send";
import { Modal, Snackbar } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import { set } from "firebase/database";
import "./ListPage.css"; // CSSをインポート

const ListPage = () => {
  type Image = {
    url: string;
    resizedUrl: string;
    name: string;
  };
  const [images, setImages] = useState<Image[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]); // お気に入りの画像のURLを格納する配列
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
  const [isNoFileSnackbarOpen, setIsNoFileSnackbarOpen] = useState(false);
  const [errorState, setErrorState] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const uploadFormContainerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);

  const handleImageClick = (image: Image) => {
    setSelectedImage(image);
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (uploadFormContainerRef.current) {
      const marginBottom = `${uploadFormContainerRef.current.offsetHeight}px`;
      const imageGrid = document.querySelector(".image-grid");
      if (imageGrid) {
        const imageGrid = document.querySelector(".image-grid") as HTMLElement;
        imageGrid.style.marginBottom = marginBottom;
      }
    }
  }, []);

  useEffect(() => {
    const userFavoritesRef = dbRef(database, "userFavorites/test_user");
    const fav: string[] = [];
    get(userFavoritesRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          for (const key in data) {
            fav.push(data[key].url);
          }
          setFavorites(fav);
        } else {
          console.log("No data available");
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  useEffect(() => {
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
        const urlPromises = sorted.map(async (imageRef) => {
          const url = await getDownloadURL(imageRef);
          const name = imageRef.name;
          return {
            url: url,
            resizedUrl: resizedImage(url, name),
            name: name,
          };
        });
  
        const urls = await Promise.all(urlPromises);
        setImages(urls);
      } catch (error) {
        console.log(error);
        setErrorState(true);
        setErrorMessage("画像を取得できませんでした。");
      }
    }

    fetchImages();
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddButtonClick = () => {
    fileInputRef.current?.click();
  };

  const resizedImage = (url: string, name: string) => {
    const n = name.split(".");
    const resizedUrl = url.replace(
      name,
      "resized%2F" + n[0] + "_200x200." + n[1]
    );
    return resizedUrl;
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
        const url = await getDownloadURL(fileRef);
        setImages([...images, {
          url: url,
          resizedUrl: resizedImage(url, file.name),
          name: file.name,
        }])
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      console.log("アップロード完了");
      // アップロード後にフォームをリセットする
      fileInputRef.current.value = "";

      setIsSnackbarOpen(true);
    } catch (error) {
      console.log(error);
      setErrorState(true);
      setErrorMessage("画像のアップロードに失敗しました。");
    }
  };

  const handleFavoriteButtonClick = async (url: string, username: string) => {
    const userFavoritesRef = dbRef(database, "userFavorites/" + username);
    if (!favorites.includes(url)) {
      if(favorites.length >= 5) {
        setErrorState(true);
        setErrorMessage("お気に入りは5つまでです。");
        return;
      }
      push(userFavoritesRef, {
        url: url,
      });
      setFavorites([...favorites, url]);
      return;
    }
    await get(userFavoritesRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          for (const key in data) {
            if (data[key].url === url) {
              const deleteRef = dbRef(
                database,
                "userFavorites/" + username + "/" + key
              );
              set(deleteRef, {});
              setFavorites(favorites.filter((favorite) => {
                return favorite !== url;
              }));
            }
          }
        } else {
          console.log("No data available");
        }
      })
      .catch((error) => {
        console.error(error);
      });
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
            <img
              src={image.resizedUrl}
              alt=""
              loading="lazy"
              onClick={() => handleImageClick(image)}
            />
            <IconButton
              className="like-icon"
              onClick={async () =>
                handleFavoriteButtonClick(image.url, "test_user")
              }
            >
              <FavoriteIcon
                style={{
                  color: favorites.includes(image.url) ? "red" : "grey",
                }}
              />
            </IconButton>
          </div>
        ))}
      </div>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
      >
        <div style={{ color: "white" }}>
          <img src={selectedImage?.url} alt="" style={{ width: "100%" }} />
        </div>
      </Modal>
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
