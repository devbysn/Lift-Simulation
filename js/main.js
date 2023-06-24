// Getting elements from document
let liftForm = document.getElementById("lift-form");
let regenerateButton = document.getElementById("regenerate");
let floorNumInput = document.getElementById("floor-num");
let liftNumInput = document.getElementById("lift-num");
let container = document.querySelector(".container");
let liftsState = [];

//------------------Regenerate function----------------------
regenerateButton.addEventListener("click", (event) => {
  console.log("Regenerate button clicked");
  liftForm.style.display = "block";
  regenerateButton.style.display = "none";
  container.innerHTML = "";
});

// Event Handler for form submission
liftForm.addEventListener("submit", (event) => {
  event.preventDefault();

  console.log("Form submitted");

  // Get the form input values
  let floorNum = parseInt(floorNumInput.value);
  let liftNum = parseInt(liftNumInput.value);

  // validate input
  if (liftNum < 1 || liftNum > 7) {
    console.log("Invalid lift number input");
    document.querySelector(".error-text").textContent =
      "Please enter lift value between 1 to 7";
    return;
  }
  if (floorNum < 2 || floorNum > 10) {
    console.log("Invalid floor number input");
    document.querySelector(".error-text").textContent =
      "Please enter Floor value between 2 to 10";
    return;
  }

  liftForm.style.display = "none";
  regenerateButton.style.display = "block";
  createState(liftNum);
  createSimulation(floorNum, liftNum);
});

// state for keeping track of idle and utilized lifts
function createState(lifts) {
  console.log("Creating state for lifts");
  liftsState = [];
  for (let i = 0; i < lifts; i++) {
    liftsState.push({ idle: true, currentFloor: 0 });
  }
}

function moveLift(index, floor) {
  console.log(`Moving lift ${index} to floor ${floor}`);
  let lifts = document.querySelectorAll(".elevator");
  let currLift = lifts[index];

  let bottom = floor * 120;
  let currentBottom = parseValue(currLift.style.bottom);
  let diff = bottom - currentBottom;
  let time = diff ? Math.abs(diff) * 20 : 0;
  let direction = true; // true means up direction
  if (currentBottom == bottom) {
    // only open the doors here
    console.log("Reached the floor, opening doors");
    doorAnimation(index, currLift);
  } else if (currentBottom > bottom) {
    direction = false;
  }

  function move() {
    let elapsedTime = Date.now() - startTime;
    let newBottom = currentBottom + (diff / time) * elapsedTime;
    currLift.style.bottom = newBottom + "px";
    if (direction ? newBottom >= bottom : newBottom <= bottom) {
      currLift.style.bottom = bottom + "px";
      console.log("Reached the floor, opening doors");
      doorAnimation(index, currLift);
      return;
    }
    requestAnimationFrame(move);
  }

  let startTime = Date.now();
  requestAnimationFrame(move);
}

function doorAnimation(index, currLift) {
  console.log(`Animating doors for lift ${index}`);
  let leftDoor = currLift.querySelector(".left");
  let rightDoor = currLift.querySelector(".right");

  openLift(leftDoor, rightDoor, index);
}

function closeLift(leftDoor, rightDoor, index) {
  console.log(`Closing doors for lift ${index}`);
  const duration = 1000;
  const targetWidth = 50;
  const start = performance.now();

  function animateWidth(timestamp) {
    const elapsed = timestamp - start;
    const progress = Math.min(elapsed / duration, 1);
    const width = progress * targetWidth;

    leftDoor.style.width = `${width}px`;
    rightDoor.style.width = `${width}px`;

    if (progress < 1) {
      requestAnimationFrame(animateWidth);
    } else {
      liftsState[index].idle = true;
    }
  }
  requestAnimationFrame(animateWidth);
}

function openLift(leftDoor, rightDoor, index) {
  console.log(`Opening doors for lift ${index}`);
  let startWidth = 50;
  let duration = 1000;
  let startTimestamp = null;

  function frame(timestamp) {
    if (!startTimestamp) startTimestamp = timestamp;
    let elapsed = timestamp - startTimestamp;
    let progress = Math.max(0, Math.min(elapsed / duration, 1));
    let width = startWidth * (1 - progress);

    leftDoor.style.width = width + "px";
    rightDoor.style.width = width + "px";

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      closeLift(leftDoor, rightDoor, index);
    }
  }
  requestAnimationFrame(frame);
}

function handleLiftBtnClick(index, up) {
  console.log(`Lift button clicked for lift ${index}`);
  let y = getIdleLift(index);

  if (y == -1) {
    let intervalId = setInterval(function checkLiftAvailable() {
      let re = getIdleLift(index);
      console.log("Checking for available lift", re);
      if (re !== -1) {
        moveLift(re, index);
        clearInterval(intervalId);
      }
    });
  } else {
    moveLift(y, index);
  }
}

function getIdleLift(destination) {
  console.log(`Checking for idle lift to reach floor ${destination}`);
  let minDis = Infinity;
  let res = -1;

  for (let i = 0; i < liftsState.length; i++) {
    if (liftsState[i].idle) {
      let currDiff = Math.abs(destination - liftsState[i].currentFloor);
      console.log("Checking lift", i, "with difference", currDiff);
      if (currDiff < minDis) {
        minDis = currDiff;
        res = i;
      }
    }
  }

  if (res !== -1) {
    liftsState[res].idle = false;
    liftsState[res].currentFloor = destination;
  }
  return res;
}

function parseValue(position) {
  console.log("Parsing value", position);
  if (position == "") return 0;
  return parseInt(position.substring(0, position.length - 2));
}

function createSimulation(f, l) {
  console.log("Creating simulation with", f, "floors and", l, "lifts");
  let fragment = document.createDocumentFragment();
  for (let i = 0; i < f; i++) {
    let fl = createFloor(f - i - 1);
    console.log("Created floor", fl);
    if (i == f - 1) {
      let lifts = createLift(l);
      fl.append(lifts);
    }
    fragment.append(fl);
  }

  container.textContent = null;
  container.append(fragment);
}

function createFloor(index) {
  console.log("Creating floor", index);
  let fl = document.createElement("div");
  fl.classList.add("single-floor");

  // floor number
  let floorNumber = document.createElement("span");
  floorNumber.innerText = "Floor : " + (index + 1);
  let btnContainer = document.createElement("div");
  btnContainer.classList.add("box", "btn-box");
  let upBtn = createBtn("UP");
  let downBtn = createBtn("DOWN");
  upBtn.classList.add("btn", "lift-btn");
  upBtn.addEventListener("click", function () {
    handleLiftBtnClick(index, true);
  });
  downBtn.addEventListener("click", function () {
    handleLiftBtnClick(index, false);
  });
  downBtn.classList.add("btn", "lift-btn");

  btnContainer.append(upBtn, downBtn);
  fl.append(floorNumber);
  fl.append(btnContainer);
  return fl;
}

function createBtn(text) {
  console.log("Creating button with text", text);
  let btn = document.createElement("button");
  btn.textContent = text;
  return btn;
}

function createLift(n) {
  console.log("Creating", n, "lifts");
  let fg = document.createDocumentFragment();
  for (let i = 0; i < n; i++) {
    fg.append(lift());
  }
  return fg;
}

function lift() {
  console.log("Creating lift");
  let liftContainer = document.createElement("div");
  let elevator = document.createElement("div");
  liftContainer.classList.add("box");
  elevator.classList.add("elevator");
  let leftDoor = document.createElement("div");
  let rightDoor = document.createElement("div");
  leftDoor.classList.add("door", "left");
  rightDoor.classList.add("door", "right");
  elevator.id = "elevator";
  elevator.append(leftDoor, rightDoor);
  liftContainer.append(elevator);
  return liftContainer;
}
