const canvas = document.querySelector('.main-canvas');
canvas.style.width = '100%';
canvas.style.height = '100%';
const width = canvas.width = canvas.offsetWidth;
const height = canvas.height = canvas.offsetHeight;
const ctx = canvas.getContext('2d');

class Settings {
    constructor(gridWidth, parkChance) {
        this.gridWidth = gridWidth;
        this.gridHeight = Math.floor(height / width * this.gridWidth);
        this.parkChance = parkChance;
    }

    setGridWidth(gridWidth) {
        this.gridWidth = gridWidth;
    }

    setGridHeight(gridHeight) {
        this.gridHeight = gridHeight;
    }

    setParkChance(parkChance) {
        this.parkChance = parkChance;
    }
}

class Cell {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.isPark = this.#generatePark();
    }

    #generatePark() {
        let t = Math.random() * 100;
        return t <= settings.parkChance;
    }

    draw() {
        if (this.isPark) {
            ctx.fillStyle = '#7ec850';
            ctx.fillRect(this.x, this.y, this.width, this.height);

            let numOfTrees = random(5, 25);
            for (let i = 0; i < numOfTrees; i++) {
                let treeX = random(this.x + .1 * this.width, this.x + .9 * this.width);
                let treeY = random(this.y + .1 * this.height, this.y + .9 * this.height);
                let treeR = random(.05 * Math.min(this.width, this.height),
                    Math.min(.2 * Math.min(this.width, this.height), treeX - this.x, this.x + this.width - treeX,
                        treeY - this.y, this.y + this.height - treeY));
                ctx.fillStyle = randomRGB(64, 95, 160, 255, 64, 95);
                ctx.beginPath();
                ctx.arc(treeX, treeY, treeR, 0, 2 * Math.PI, false);
                ctx.fill();
            }
        }
        else {
            ctx.fillStyle = '#95a5a6';
            ctx.fillRect(this.x, this.y, this.width, this.height);

            let minHouseSize = .2 * Math.min(this.width, this.height);
            let maxHouseSize = .4 * Math.min(this.width, this.height);

            let houseX = this.x;
            let houseWidth = random(minHouseSize, Math.min(this.x + this.width - minHouseSize - houseX, maxHouseSize));
            let houseDepth = random(minHouseSize, maxHouseSize);
            let firstHouseWidth = houseWidth;
            let firstHouseDepth = houseDepth;
            ctx.fillStyle = randomRGB(160, 255, 64, 95, 64, 95);
            ctx.fillRect(houseX, this.y, houseWidth, houseDepth);
            houseX += houseWidth;
            while (houseX + maxHouseSize < this.x + this.width) {
                houseWidth = random(minHouseSize, Math.min(this.x + this.width - minHouseSize - houseX, maxHouseSize));
                houseDepth = random(minHouseSize, maxHouseSize);
                ctx.fillStyle = randomRGB(160, 255, 64, 95, 64, 95);
                ctx.fillRect(houseX, this.y, houseWidth, houseDepth);
                houseX += houseWidth;
            }
            ctx.fillStyle = randomRGB(160, 255, 64, 95, 64, 95);
            let houseY = random(minHouseSize, maxHouseSize);
            ctx.fillRect(houseX, this.y, this.x + this.width - houseX, houseY);

            houseY += this.y;
            ctx.fillStyle = randomRGB(160, 255, 64, 95, 64, 95);
            houseWidth = random(minHouseSize, Math.min(this.y + this.height - minHouseSize - houseY, maxHouseSize));
            houseDepth = random(minHouseSize, this.x + this.width - houseX);
            ctx.fillRect(this.x + this.width - houseDepth, houseY, houseDepth, houseWidth);
            houseY += houseWidth;
            while (houseY + maxHouseSize < this.y + this.height) {
                houseWidth = random(minHouseSize, Math.min(this.y + this.height - minHouseSize - houseY, maxHouseSize));
                houseDepth = random(minHouseSize, maxHouseSize);
                ctx.fillStyle = randomRGB(160, 255, 64, 95, 64, 95);
                ctx.fillRect(this.x + this.width - houseDepth, houseY, houseDepth, houseWidth);
                houseY += houseWidth;
            }
            ctx.fillStyle = randomRGB(160, 255, 64, 95, 64, 95);
            houseX = random(minHouseSize, maxHouseSize);
            ctx.fillRect(this.x + this.width - houseX, houseY, houseX, this.y + this.height - houseY);

            houseX = this.x + this.width - houseX;
            ctx.fillStyle = randomRGB(160, 255, 64, 95, 64, 95);
            houseWidth = random(minHouseSize, Math.min(houseX - this.x - minHouseSize, maxHouseSize));
            houseDepth = random(minHouseSize, this.y + this.height - houseY);
            ctx.fillRect(houseX - houseWidth, this.y + this.height - houseDepth, houseWidth, houseDepth);
            houseX -= houseWidth;
            while (houseX - maxHouseSize > this.x) {
                houseWidth = random(minHouseSize, Math.min(houseX - this.x - minHouseSize, maxHouseSize));
                houseDepth = random(minHouseSize, maxHouseSize);
                ctx.fillStyle = randomRGB(160, 255, 64, 95, 64, 95);
                ctx.fillRect(houseX - houseWidth, this.y + this.height - houseDepth, houseWidth, houseDepth);
                houseX -= houseWidth;
            }
            ctx.fillStyle = randomRGB(160, 255, 64, 95, 64, 95);
            houseY = random(minHouseSize, Math.min(this.height - firstHouseDepth - 2 * minHouseSize, maxHouseSize));
            ctx.fillRect(this.x, this.y + this.height - houseY, houseX - this.x, houseY);

            houseY = this.y + this.height - houseY;
            ctx.fillStyle = randomRGB(160, 255, 64, 95, 64, 95);
            houseWidth = random(minHouseSize, Math.min(houseY - this.y - firstHouseDepth - minHouseSize, maxHouseSize));
            houseDepth = random(minHouseSize, houseX - this.x);
            ctx.fillRect(this.x, houseY - houseWidth, houseDepth, houseWidth);
            houseY -= houseWidth;
            while (houseY - maxHouseSize - firstHouseDepth > this.y) {
                houseWidth = random(minHouseSize, Math.min(houseY - this.y - firstHouseDepth - minHouseSize, maxHouseSize));
                houseDepth = random(minHouseSize, maxHouseSize);
                ctx.fillStyle = randomRGB(160, 255, 64, 95, 64, 95);
                ctx.fillRect(this.x, houseY - houseWidth, houseDepth, houseWidth);
                houseY -= houseWidth;
            }
            ctx.fillStyle = randomRGB(160, 255, 64, 95, 64, 95);
            houseDepth = random(minHouseSize, firstHouseWidth);
            ctx.fillRect(this.x, this.y + firstHouseDepth, houseDepth, houseY - this.y - firstHouseDepth);
        }
    }

    drawHouses(roadWidth) {
        let margin = Math.floor(.7 * roadWidth);

        // ...
    }
}

class Road {
    constructor(x, y, width, mileage, vertical) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.mileage = mileage;
        this.vertical = vertical;
    }

    draw() {
        ctx.fillStyle = '#34495e';
        if (this.vertical) {
            ctx.fillRect(this.x, this.y, this.width, this.mileage);
        }
        else {
            ctx.fillRect(this.x, this.y, this.mileage, this.width);
        }
    }
}

class Intersection {
    constructor(x, y, width, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.type = type;
    }

    draw() {
        ctx.fillStyle = '#34495e';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);

        if (this.type == 0) {
            ctx.lineTo(this.x + this.width, this.y);
            ctx.lineTo(this.x, this.y + this.width);
            ctx.lineTo(this.x, this.y);
        }
        else if (this.type == 1) {
            ctx.lineTo(this.x - this.width, this.y);
            ctx.lineTo(this.x, this.y + this.width);
            ctx.lineTo(this.x, this.y);
        }
        else if (this.type == 2) {
            ctx.lineTo(this.x - this.width, this.y);
            ctx.lineTo(this.x, this.y - this.width);
            ctx.lineTo(this.x, this.y);
        }
        else if (this.type == 3) {
            ctx.lineTo(this.x + this.width, this.y);
            ctx.lineTo(this.x, this.y - this.width);
            ctx.lineTo(this.x, this.y);
        }

        ctx.fill();
    }
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomRGB(minR, maxR, minG, maxG, minB, maxB) {
    return `rgb(${random(minR, maxR)},${random(minG, maxG)},${random(minB, maxB)})`;
}

function generateGrid() {
    cells = [];
    roads = [];
    intersections = [];

    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(0, 0, width, height);

    const cellWidth = Math.round(width / settings.gridWidth);
    const cellHeight = Math.round(height / settings.gridHeight);
    const roadWidth = Math.floor(.125 * Math.min(cellWidth, cellHeight));
    const canvasWidth = settings.gridWidth * cellWidth;
    const canvasHeight = settings.gridHeight * cellHeight;

    for (let y = 0; y < canvasHeight; y += cellHeight) {
        for (let x = 0; x < canvasWidth; x += cellWidth) {
            cells.push(new Cell(x, y, cellWidth, cellHeight));

            if (x > 0) {
                if (!(cells[cells.length - 1].isPark && cells[cells.length - 2].isPark)) {
                    roads.push(new Road(x - roadWidth / 2, y, roadWidth, cellHeight, true));
                }
            }
            if (y > 0) {
                if (!(cells[cells.length - 1].isPark && cells[cells.length - settings.gridWidth - 1].isPark)) {
                    roads.push(new Road(x, y - roadWidth / 2, roadWidth, cellWidth, false));
                }
            }

            if (!cells[cells.length - 1].isPark) {
                intersections.push(new Intersection(x - roadWidth / 2, y - roadWidth / 2,
                    2.75 * roadWidth, 0));
                intersections.push(new Intersection(x + cellWidth + roadWidth / 2, y - roadWidth / 2,
                    2.75 * roadWidth, 1));
                intersections.push(new Intersection(x + cellWidth + roadWidth / 2, y + cellHeight + roadWidth / 2,
                    2.75 * roadWidth, 2));
                intersections.push(new Intersection(x - roadWidth / 2, y + cellHeight + roadWidth / 2,
                    2.75 * roadWidth, 3));
            }
        }
    }

    roads.push(new Road(-roadWidth / 2, 0, roadWidth, height, true));
    roads.push(new Road(0, -roadWidth / 2, roadWidth, width, false));
    roads.push(new Road(canvasWidth - roadWidth / 2, 0, roadWidth, height, true));
    roads.push(new Road(0, canvasHeight - roadWidth / 2, roadWidth, width, false));

    drawGrid();
}

function drawGrid() {
    for (const cell of cells) {
        cell.draw();
    }

    for (const road of roads) {
        road.draw();
    }

    for (const intersection of intersections) {
        intersection.draw();
    }
}

function showSettings() {
    document.getElementById("settings").classList.toggle("show");
}

window.onclick = function (e) {
    if (!e.target.matches(".dropbtn") && !e.target.matches(".inc-dec")
        && !e.target.matches(".inc-dec-btn") && !e.target.matches(".value")) {
        let dropdowns = document.getElementsByClassName("dropdown-content");
        for (const dropdown of dropdowns) {
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
            }
        }
    }
}

function showSettingsValues() {
    document.getElementById("grid-width").innerHTML = settings.gridWidth;
    document.getElementById("grid-height").innerHTML = settings.gridHeight;
    document.getElementById("park-chance").innerHTML = settings.parkChance + "%";
}

function modifyValue(type, dif) {
    if (type == 0 && settings.gridWidth + dif > 0 && settings.gridWidth + dif < 100) {
        settings.setGridWidth(settings.gridWidth + dif);
        document.getElementById("grid-width").innerHTML = settings.gridWidth;
    }
    if (type == 1 && settings.gridHeight + dif > 0 && settings.gridHeight + dif < 100) {
        settings.setGridHeight(settings.gridHeight + dif);
        document.getElementById("grid-height").innerHTML = settings.gridHeight;
    }
    if (type == 2 && settings.parkChance + dif >= 0 && settings.parkChance + dif <= 100) {
        settings.setParkChance(settings.parkChance + dif);
        document.getElementById("park-chance").innerHTML = settings.parkChance + "%";
    }
}

let settings = new Settings(16, 10);
let cells;
let roads;
let intersections;

generateGrid();