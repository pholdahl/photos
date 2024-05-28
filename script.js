import supabase from "./supabaseClient.js";

// Variables
let albums = {};
let photos = {};
let zIndexArray = [];
let select = document.getElementById("select-album");
const header = document.getElementById("header");
const content = document.getElementById("content");
const description = document.getElementById("description");
const photocontainer = document.getElementById("photocontainer");
const main = document.getElementById("main");

console.log(supabase);

// API endpoints
// const albumData = "http://localhost:3000/albums";
// const photoData = "http://localhost:3000/photos";

// Fetcher function json-server
// const getData = async (records) => {
//   try {
//     const response = await fetch(records);
//     return await response.json();
//   } catch (error) {
//     console.error("Failed to fetch data from", records, ":", error);
//   }
// };

// Fetcher function supabase
const getData = async (table) => {
  try {
    const { data, error } = await supabase.from(table).select();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Failed to fetch data from ${table}:`, error);
  }
};

// Initialization function
const initializeContent = async () => {
  try {
    albums = await getData("albums");
    photos = await getData("photos");
    console.log(albums);
    populateSelect(albums);
    if (albums.length > 0) {
      select.value = albums[albums.length - 1].id;
      select.dispatchEvent(new Event("change"));
    }
  } catch (error) {
    console.error("Failed to intialize data:", error);
  }
};

// Function to populate the select element with the album data
const populateSelect = async (albums) => {
  albums.forEach((album) => {
    const option = document.createElement("option");
    option.value = album.id;
    option.textContent = album.headline;
    select.appendChild(option);
  });
};

// Function to update the content based on the selected album
const updateContent = (album, relevantPhotos) => {
  if (!album) {
    console.error("No album found");
    header.innerHTML = `<h1>Something went wrong</h1>`;
    return;
  }

  header.innerHTML = `<h1> ${album.headline}</h1>`;
  if (album.description.length > 30) {
    const split = splitSentence(album.description);
    description.innerHTML = `<h2>${split[0]}<br>${split[1]}</h2>`;
  } else {
    description.innerHTML = `<h2>${album.description}</h2>`;
  }
  spreadPhotos(relevantPhotos);
};

// Function to make the photos draggable
const makeDraggable = (element) => {
  let startPosX = 0,
    startPosY = 0;
  let origX = 0,
    origY = 0;
  let velocityX = 0,
    velocityY = 0;
  let lastX = 0,
    lastY = 0;
  let originalZIndex = "";

  let clickStartTime = 0;
  let threshold = 100;

  const dragMouseDown = (e) => {
    e.preventDefault();

    clickStartTime = new Date().getTime();

    startPosX = e.clientX;
    startPosY = e.clientY;
    lastX = startPosX;
    lastY = startPosY;

    origX = element.offsetLeft;
    origY = element.offsetTop;
    originalZIndex = element.style.zIndex;

    clickStartTime = new Date().getTime();

    // elevate the element when picking it up
    element.style.zIndex = 10000;
    element.style.transform = "scale(1.3)";
    element.style.transition = "transform 0.1s";

    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;

    // Clear any ongoing momentum effect
    if (element.momentumID) {
      clearInterval(element.momentumID);
      element.momentumID = null;
    }
  };

  const elementDrag = (e) => {
    e.preventDefault();
    const dx = e.clientX - startPosX;
    const dy = e.clientY - startPosY;

    // new positions before being set
    let newLeft = origX + dx;
    let newTop = origY + dy;

    // calculate bounds of the container element
    let mainRect = content.getBoundingClientRect();
    // calculate bonds of the container
    newLeft = Math.max(
      0,
      Math.min(newLeft, mainRect.width - element.offsetWidth)
    );
    newTop = Math.max(
      0,
      Math.min(newTop, mainRect.height - element.offsetHeight)
    );

    element.style.left = newLeft + "px";
    element.style.top = newTop + "px";

    // Calculate velocity
    velocityX = e.clientX - lastX;
    velocityY = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
  };

  const closeDragElement = () => {
    // Reset the element's properties
    let mainRect = content.getBoundingClientRect();
    let biggestZIndex = Math.max(...zIndexArray);
    let newBigZIndex = parseInt(biggestZIndex) + 1;
    zIndexArray.push(newBigZIndex);

    element.style.zIndex = newBigZIndex;
    element.style.transition = "transform 0.1s ease";

    // Stop the movement when the mouse button is released
    document.onmouseup = null;
    document.onmousemove = null;

    let clickDuration = new Date().getTime() - clickStartTime;

    if (clickDuration < threshold) {
      toggleEnlarge(element);
    }

    // Random rotation array to choose from
    const rotationArray = [-18, -14, -10, -6, -2, 2, 6, 10, 14, 18];
    let rotation =
      rotationArray[Math.floor(Math.random() * rotationArray.length)]; // Use a random rotation from the array

    // Start momentum
    element.momentumID = setInterval(() => {
      let mainRect = content.getBoundingClientRect();
      if (Math.abs(velocityX) < 0.5 && Math.abs(velocityY) < 0.5) {
        clearInterval(element.momentumID);
        element.momentumID = null;
      } else {
        let elementLeft = parseInt(element.style.left, 10);
        let elementTop = parseInt(element.style.top, 10);
        let boundaryCrossed = false;

        // Check and adjust for horizontal boundaries
        if (elementLeft < 0) {
          elementLeft = 0;
          velocityX = -velocityX * 0.2; // Reverse and dampen the velocity significantly
          boundaryCrossed = true;
        } else if (elementLeft > mainRect.width - element.offsetWidth) {
          elementLeft = mainRect.width - element.offsetWidth;
          velocityX = -velocityX * 0.1; // Reverse and dampen the velocity significantly
          boundaryCrossed = true;
        }

        // Check and adjust for vertical boundaries
        if (elementTop < 0) {
          elementTop = 0;
          velocityY = -velocityY * 0.1; // Reverse and dampen the velocity significantly
          boundaryCrossed = true;
        } else if (elementTop > mainRect.height - element.offsetHeight) {
          elementTop = mainRect.height - element.offsetHeight;
          velocityY = -velocityY * 0.1; // Reverse and dampen the velocity significantly
          boundaryCrossed = true;
        }

        // Apply normal friction if no boundary was crossed
        if (!boundaryCrossed) {
          velocityX *= 0.9;
          velocityY *= 0.9;
        }

        let newX = elementLeft + velocityX;
        let newY = elementTop + velocityY;

        element.style.left = newX + "px";
        element.style.top = newY + "px";
        element.style.transform = `scale(1) rotate(${rotation}deg)`;
        element.style.transition = "transform 0.5s ease";
      }
    }, 20); // Update interval
  };
  element.onmousedown = dragMouseDown;
};

const spreadPhotos = (photos) => {
  console.log("photos", photos);
  let photoHTML = "";
  photos.forEach((photo) => {
    photoHTML += `<div class="picture" id="pic${photo.id}"><img src="${photo.url}"/>
                    <span style="display: block;">${photo.description}</span>
                    <a target="_blank" href="${photo.url}" style="display: block;">Open full size</a>
                  </div>`;
  });
  photocontainer.innerHTML = photoHTML;
  console.log(photocontainer);

  // make phtos draggable
  photos.forEach((photo) => {
    const photoElement = document.getElementById(`pic${photo.id}`);
    photoElement.style.zIndex = photo.id;
    zIndexArray.push(photo.id);
    makeDraggable(photoElement);
    spreadOutRandomly(photoElement);
  });
};

const spreadOutRandomly = (element) => {
  const mainRect = main.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const buffer = 100;
  const randomX =
    (Math.random() * (mainRect.width - elementRect.width) + buffer) * 0.8;
  const randomY =
    (Math.random() * (mainRect.height - elementRect.height) + buffer * 4) * 0.6;
  const randomRotation = Math.random() * 90 - 60;
  element.style.transform = `rotate(${randomRotation}deg)`;
  element.style.left = randomX + "px";
  element.style.top = randomY + "px";
};

// Toggle enlarge state
const toggleEnlarge = (element) => {
  element.classList.toggle("enlarged");

  const span = element.querySelector("span");
  const a = element.querySelector("a");

  // Check the current font size and toggle it
  if (span.style.fontSize === "130px" && a.style.fontSize === "30px") {
    span.style.fontSize = "";
    a.style.fontSize = "";
  } else {
    span.style.fontSize = "130px";
    a.style.fontSize = "30px";
  }
};

// Helper functions

// splitSentence is a function that splits the description based on the length,
// where there is a white space, so not to overflow the container
const splitSentence = (sentence) => {
  const words = sentence.split(" ");
  let first = "";
  let second = "";
  words.forEach((word) => {
    if (first.length + word.length <= 30) {
      first += word + " ";
    } else {
      second += word + " ";
    }
  });
  return [first, second];
};

// Running the initialization function
initializeContent();

// Event listener for the select element
select.addEventListener("change", () => {
  const selectedalbum = albums.find(
    (v) => parseInt(v.id) === parseInt(select.value)
  );
  console.log(photos);
  const relevantPhotos = photos.filter(
    (p) => parseInt(p.album_id) === parseInt(select.value)
  );
  updateContent(selectedalbum, relevantPhotos);
});
