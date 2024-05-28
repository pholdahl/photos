import supabase from "./supabaseClient.js";

function setupAuthListener() {
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      console.log("User details:", session.user);
      return;
      // User is logged in
    } else {
      // User is logged out or there is no session
      window.location.replace("admin.html");
    }
  });
}

setupAuthListener();

// Array to store album information like PK, headline, and description
let albumData = [];

// Selected photos shown as icons in a grid on the page
let photosToUpload = [];

// Photos uploaded to the image service provider and stored with url, FK, and description
let uploadedPhotos = [];

// Get the input element for uploading photos and the grid to display them
const choosePhotos = document.getElementById("photoUpload");
const photoGrid = document.getElementById("photoGrid");

// Image ServiceProvider website: https://imgbb.com/ + API key;
const imageServiceProvider =
  "https://api.imgbb.com/1/upload?key=40e8017ba1e5675520453db7d9e56bdd";

// Bind createAlbum function to the button
const createAlbumButton = document.getElementById("createAlbumButton");
createAlbumButton.addEventListener("click", createAlbum);

// // Database API endpoint: http://localhost:3000/albums
// const albumAPI = "http://localhost:3000/albums";

// // Database API endpoint: http://localhost:3000/photos
// const photoAPI = "http://localhost:3000/photos";

const showPhotosToUpload = (files) => {
  Array.from(files).forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const photoUrl = e.target.result;
      const photoItem = document.createElement("div");
      photoItem.classList.add("photoUploadContainer");
      photoItem.innerHTML = `
        <img src="${photoUrl}" alt="Uploaded Photo" style="width: 100%; height: auto;">
        <input type="text" id="desc_${index}" name="desc_${index}" placeholder="Enter description..." required"></input>
      `;
      photoGrid.appendChild(photoItem);
      photosToUpload.push({ file, description: "", index });
    };
    reader.readAsDataURL(file);
  });
};

// Event listener for when photos are selected
choosePhotos.addEventListener("change", (event) => {
  const files = event.target.files;
  photoGrid.innerHTML = ""; // Clear previous entries
  photosToUpload = [];

  showPhotosToUpload(files);
});

// A general POST request function which handles JSON and FormData types:
const postRequest = async (url, data) => {
  const options = {
    method: "POST",
    headers: {},
    body: data,
  };

  if (!(data instanceof FormData)) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text(); // Attempt to read response text
    throw new Error(`HTTP error ${response.status}: ${errorText}`);
  }
  return await response.json();
};

// Get the headline and description from the input fields
const getHeadlineAndDescription = () => {
  const headline = document.getElementById("headerInput").value;
  const description = document.getElementById("contentDescription").value;
  return { headline, description };
};

// Create an album with headline and description, upload to image service provider, get the phot url, and send the album data
export async function createAlbum() {
  if (
    photosToUpload.some(
      (photo) => !document.getElementById(`desc_${photo.index}`).value.trim()
    ) ||
    !document.getElementById("headerInput").value.trim() ||
    !document.getElementById("contentDescription").value.trim()
  ) {
    alert("Please fill in all descriptions before uploading.");
    return;
  }

  albumData.push(getHeadlineAndDescription());

  for (const photo of photosToUpload) {
    photo.description = document.getElementById(`desc_${photo.index}`).value;
    const formData = new FormData();
    formData.append("image", photo.file);
    try {
      const photoObject = await postRequest(imageServiceProvider, formData);
      console.log(photoObject);
      const photoUrl = photoObject.data.url;
      uploadedPhotos.push({
        url: photoUrl,
        description: photo.description,
      });
    } catch (error) {
      console.error("Error uploading photos:", error);
    }
  }
  console.log("Photos uploaded successfully!", uploadedPhotos);
  sendAlbumData();
}

// Send album data to the database
const sendAlbumData = async () => {
  console.log("Sending album data:", albumData[0]);
  try {
    const { data: album, error: albumError } = await supabase
      .from("albums")
      .insert([albumData[0]])
      .select();
    if (albumError) throw albumError;
    const album_id = album[0].id;
    console.log("Album ID received:", album_id);

    for (const photo of uploadedPhotos) {
      console.log("Uploading photo:", photo);
      try {
        const photoData = { ...photo, album_id };
        const { data: photoResponse, error: photoError } = await supabase
          .from("photos")
          .insert([photoData]);
        if (photoError) throw photoError;
        console.log("Photo uploaded successfully", photoResponse);
      } catch (photoError) {
        console.error("Failed to upload photo:", photoError);
        throw new Error("Stopping further uploads due to failure.");
      }
    }
    console.log("Album and all photos added successfully");
    window.location.replace("index.html");
  } catch (error) {
    console.error("Error in album or photo upload:", error);
    alert("There was an error submitting the data. Please try again.");
  }
};

// Send album data to the database
// const sendAlbumData = async () => {
//   console.log("Sending album data:", albumData[0]);
//   try {
//     const album = await postRequest(albumAPI, albumData[0]);
//     const albumId = album.id;
//     console.log("Album ID received:", albumId);

//     for (const photo of uploadedPhotos) {
//       console.log("Uploading photo:", photo);
//       try {
//         const photoData = { ...photo, albumId };
//         const photoResponse = await postRequest(photoAPI, photoData);
//         console.log("Photo uploaded successfully", photoResponse);
//       } catch (photoError) {
//         console.error("Failed to upload photo:", photoError);
//         throw new Error("Stopping further uploads due to failure.");
//       }
//     }
//     console.log("Album and all photos added successfully");
//     window.location.replace("index.html");
//   } catch (error) {
//     console.error("Error in album or photo upload:", error);
//     alert("There was an error submitting the data. Please try again.");
//   }
// };
