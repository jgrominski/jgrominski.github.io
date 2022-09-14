const canvas = document.querySelector('.main-canvas');
canvas.style.width = '100%';
canvas.style.height = '100%';
const width = canvas.width = canvas.offsetWidth;
const height = canvas.height = canvas.offsetHeight;
const ctx = canvas.getContext('2d');

class Settings {
    constructor() {
        this.cellProp = .4;
        this.subcellProp = .1;

        this.minCellSize = Math.round(this.cellProp * Math.min(width, height));
        this.minSubcellSize = Math.round(this.subcellProp * Math.min(width, height));
        this.subcellMargin = Math.round(this.subcellProp / 5 * Math.min(width, height));
        this.roadWidth = this.subcellProp * 40;

        this.chanceOfLake = 0.05;
        this.chanceOfForest = 0.1;
        this.chanceOfPalace = 0.05;

        this.outerInnerProp = 0.5;
        
        this.chanceOfGov = 0.1;
        this.chanceOfChurch = 0.05;
        this.chanceOfBuildings = 0.85;
        this.chanceOfPark = 0.1;
        
        this.riverWidth = this.subcellProp * 300;
        this.includeRiver = true;
    }

    setCellSize(cellProp) {
        this.cellProp *= cellProp;
        this.minCellSize = Math.round(this.cellProp * Math.min(width, height));
    }

    setSubcellSize(subcellProp) {
        this.subcellProp *= subcellProp;
        this.minSubcellSize = Math.round(this.subcellProp * Math.min(width, height));
        this.subcellMargin = Math.round(this.subcellProp / 5 * Math.min(width, height));
        this.roadWidth = this.subcellProp * 40;
        this.riverWidth = this.subcellProp * 300;
    }
}

class Vertex {
    constructor(x, y) {
        this.x = Math.round(x);
        this.y = Math.round(y);
    }

    setX(x) {
        this.x = Math.round(x);
    }

    setY(y) {
        this.y = Math.round(y);
    }

    setVertex(v) {
        this.x = Math.round(v.x);
        this.y = Math.round(v.y);
    }

    equals(v) {
        return this.x == v.x && this.y == v.y;
    }
}

class Tree {
    constructor(center, radius) {
        this.center = new Vertex(center.x, center.y);
        this.radius = Math.round(radius);
        this.treeRadius = Math.round(2 / 3 * this.radius);
        this.color = randomRGB(0, 63, 96, 191, 0, 63);
        this.leaves = [];
        
        this.generate();
    }

    generate() {
        let startV = new Vertex(this.center.x, this.center.y - this.radius);
        let v1 = new Vertex(this.center.x, this.center.y - this.radius);

        for (let angle = 0; angle < 2 * Math.PI;) {
            if (2 * Math.PI - angle < Math.PI / 3) {
                angle = 2 * Math.PI;
            }
            else {
                angle += randomFloat(Math.PI / 9, Math.min(Math.PI / 3, 17 / 9 * Math.PI - angle));
            }
            
            let v2 = new Vertex(this.center.x + Math.cos(angle) * (startV.x - this.center.x) - Math.sin(angle) * (startV.y - this.center.y), this.center.y + Math.sin(angle) * (startV.x - this.center.x) + Math.cos(angle) * (startV.y - this.center.y));
            let leafCenter = new Vertex((v1.x + v2.x) / 2, (v1.y + v2.y) / 2);
            let leafRadius = calculateDistance(v1, v2) / 2;

            this.leaves.push({
                center: leafCenter,
                radius: leafRadius
            });

            v1.setVertex(v2);
        }
    }

    draw() {
        ctx.strokeStyle = '#093923';
        ctx.lineWidth = 2;
        for (const leaf of this.leaves) {
            ctx.beginPath();
            ctx.arc(leaf.center.x, leaf.center.y, leaf.radius + 1, 0, 2 * Math.PI);
            ctx.stroke();
        }

        ctx.fillStyle = this.color;
        for (const leaf of this.leaves) {
            ctx.beginPath();
            ctx.arc(leaf.center.x, leaf.center.y, leaf.radius, 0, 2 * Math.PI);
            ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Subcell {
    constructor(vertices, neighbourhood, churchMultiplier) {
        this.vertices = [];
        for (const vertex of vertices) {
            this.vertices.push(new Vertex(vertex.x, vertex.y));
        }
        this.neighbourhood = neighbourhood;
        this.churchMultiplier = churchMultiplier;
        this.type = this.generateType();
        this.margin = [];

        this.calculateMargin();
    }

    generateType() {
        let type = randomFloat(0, 1);

        if (type < settings.chanceOfGov) {
            return 4;
        }
        else if (type < settings.chanceOfGov + this.churchMultiplier * settings.chanceOfChurch) {
            return 3;
        }
        else if (type < settings.chanceOfGov + this.churchMultiplier * settings.chanceOfChurch + settings.chanceOfPark) {
            return 1;
        }
        else {
            return 2;
        }
    }

    calculateMargin() {
        let crossPoint = findIntersection(this.vertices[0], this.vertices[2], this.vertices[1], this.vertices[3]);

        let edgeDifX1 = Math.abs(settings.subcellMargin * (this.vertices[1].y - this.vertices[0].y) / calculateDistance(this.vertices[0], this.vertices[1]));
        let edgeDifY1 = Math.abs(settings.subcellMargin * (this.vertices[1].x - this.vertices[0].x) / calculateDistance(this.vertices[0], this.vertices[1]));
        
        let v11a = new Vertex(this.vertices[0].x + edgeDifX1, this.vertices[0].y + edgeDifY1);
        let v12a = new Vertex(this.vertices[1].x + edgeDifX1, this.vertices[1].y + edgeDifY1);
        let v11b = new Vertex(this.vertices[0].x + edgeDifX1, this.vertices[0].y - edgeDifY1);
        let v12b = new Vertex(this.vertices[1].x + edgeDifX1, this.vertices[1].y - edgeDifY1);
        let v11c = new Vertex(this.vertices[0].x - edgeDifX1, this.vertices[0].y - edgeDifY1);
        let v12c = new Vertex(this.vertices[1].x - edgeDifX1, this.vertices[1].y - edgeDifY1);
        let v11d = new Vertex(this.vertices[0].x - edgeDifX1, this.vertices[0].y + edgeDifY1);
        let v12d = new Vertex(this.vertices[1].x - edgeDifX1, this.vertices[1].y + edgeDifY1);
        let v11 = new Vertex(0, 0);
        let v12 = new Vertex(0, 0);

        if (Math.abs(pointToLineDistanceByVertices(this.vertices[0], this.vertices[1], v11a) - settings.subcellMargin) < Math.abs(pointToLineDistanceByVertices(this.vertices[0], this.vertices[1], v11b) - settings.subcellMargin)) {
            if (pointToLineDistanceByVertices(v11a, v12a, crossPoint) < pointToLineDistanceByVertices(v11c, v12c, crossPoint)) {
                v11.setVertex(v11a);
                v12.setVertex(v12a);
            }
            else {
                v11.setVertex(v11c);
                v12.setVertex(v12c);
            }
        }
        else {
            if (pointToLineDistanceByVertices(v11b, v12b, crossPoint) < pointToLineDistanceByVertices(v11d, v12d, crossPoint)) {
                v11.setVertex(v11b);
                v12.setVertex(v12b);
            }
            else {
                v11.setVertex(v11d);
                v12.setVertex(v12d);
            }
        }

        let edgeDifX2 = Math.abs(settings.subcellMargin * (this.vertices[2].y - this.vertices[1].y) / calculateDistance(this.vertices[1], this.vertices[2]));
        let edgeDifY2 = Math.abs(settings.subcellMargin * (this.vertices[2].x - this.vertices[1].x) / calculateDistance(this.vertices[1], this.vertices[2]));
        
        let v21a = new Vertex(this.vertices[1].x + edgeDifX2, this.vertices[1].y + edgeDifY2);
        let v22a = new Vertex(this.vertices[2].x + edgeDifX2, this.vertices[2].y + edgeDifY2);
        let v21b = new Vertex(this.vertices[1].x + edgeDifX2, this.vertices[1].y - edgeDifY2);
        let v22b = new Vertex(this.vertices[2].x + edgeDifX2, this.vertices[2].y - edgeDifY2);
        let v21c = new Vertex(this.vertices[1].x - edgeDifX2, this.vertices[1].y - edgeDifY2);
        let v22c = new Vertex(this.vertices[2].x - edgeDifX2, this.vertices[2].y - edgeDifY2);
        let v21d = new Vertex(this.vertices[1].x - edgeDifX2, this.vertices[1].y + edgeDifY2);
        let v22d = new Vertex(this.vertices[2].x - edgeDifX2, this.vertices[2].y + edgeDifY2);
        let v21 = new Vertex(0, 0);
        let v22 = new Vertex(0, 0);

        if (Math.abs(pointToLineDistanceByVertices(this.vertices[1], this.vertices[2], v21a) - settings.subcellMargin) < Math.abs(pointToLineDistanceByVertices(this.vertices[1], this.vertices[2], v21b) - settings.subcellMargin)) {
            if (pointToLineDistanceByVertices(v21a, v22a, crossPoint) < pointToLineDistanceByVertices(v21c, v22c, crossPoint)) {
                v21.setVertex(v21a);
                v22.setVertex(v22a);
            }
            else {
                v21.setVertex(v21c);
                v22.setVertex(v22c);
            }
        }
        else {
            if (pointToLineDistanceByVertices(v21b, v22b, crossPoint) < pointToLineDistanceByVertices(v21d, v22d, crossPoint)) {
                v21.setVertex(v21b);
                v22.setVertex(v22b);
            }
            else {
                v21.setVertex(v21d);
                v22.setVertex(v22d);
            }
        }

        let edgeDifX3 = Math.abs(settings.subcellMargin * (this.vertices[3].y - this.vertices[2].y) / calculateDistance(this.vertices[2], this.vertices[3]));
        let edgeDifY3 = Math.abs(settings.subcellMargin * (this.vertices[3].x - this.vertices[2].x) / calculateDistance(this.vertices[2], this.vertices[3]));
        
        let v31a = new Vertex(this.vertices[2].x + edgeDifX3, this.vertices[2].y + edgeDifY3);
        let v32a = new Vertex(this.vertices[3].x + edgeDifX3, this.vertices[3].y + edgeDifY3);
        let v31b = new Vertex(this.vertices[2].x + edgeDifX3, this.vertices[2].y - edgeDifY3);
        let v32b = new Vertex(this.vertices[3].x + edgeDifX3, this.vertices[3].y - edgeDifY3);
        let v31c = new Vertex(this.vertices[2].x - edgeDifX3, this.vertices[2].y - edgeDifY3);
        let v32c = new Vertex(this.vertices[3].x - edgeDifX3, this.vertices[3].y - edgeDifY3);
        let v31d = new Vertex(this.vertices[2].x - edgeDifX3, this.vertices[2].y + edgeDifY3);
        let v32d = new Vertex(this.vertices[3].x - edgeDifX3, this.vertices[3].y + edgeDifY3);
        let v31 = new Vertex(0, 0);
        let v32 = new Vertex(0, 0);

        if (Math.abs(pointToLineDistanceByVertices(this.vertices[2], this.vertices[3], v31a) - settings.subcellMargin) < Math.abs(pointToLineDistanceByVertices(this.vertices[2], this.vertices[3], v31b) - settings.subcellMargin)) {
            if (pointToLineDistanceByVertices(v31a, v32a, crossPoint) < pointToLineDistanceByVertices(v31c, v32c, crossPoint)) {
                v31.setVertex(v31a);
                v32.setVertex(v32a);
            }
            else {
                v31.setVertex(v31c);
                v32.setVertex(v32c);
            }
        }
        else {
            if (pointToLineDistanceByVertices(v31b, v32b, crossPoint) < pointToLineDistanceByVertices(v31d, v32d, crossPoint)) {
                v31.setVertex(v31b);
                v32.setVertex(v32b);
            }
            else {
                v31.setVertex(v31d);
                v32.setVertex(v32d);
            }
        }

        let edgeDifX4 = Math.abs(settings.subcellMargin * (this.vertices[0].y - this.vertices[3].y) / calculateDistance(this.vertices[0], this.vertices[3]));
        let edgeDifY4 = Math.abs(settings.subcellMargin * (this.vertices[0].x - this.vertices[3].x) / calculateDistance(this.vertices[0], this.vertices[3]));
        
        let v41a = new Vertex(this.vertices[3].x + edgeDifX4, this.vertices[3].y + edgeDifY4);
        let v42a = new Vertex(this.vertices[0].x + edgeDifX4, this.vertices[0].y + edgeDifY4);
        let v41b = new Vertex(this.vertices[3].x + edgeDifX4, this.vertices[3].y - edgeDifY4);
        let v42b = new Vertex(this.vertices[0].x + edgeDifX4, this.vertices[0].y - edgeDifY4);
        let v41c = new Vertex(this.vertices[3].x - edgeDifX4, this.vertices[3].y - edgeDifY4);
        let v42c = new Vertex(this.vertices[0].x - edgeDifX4, this.vertices[0].y - edgeDifY4);
        let v41d = new Vertex(this.vertices[3].x - edgeDifX4, this.vertices[3].y + edgeDifY4);
        let v42d = new Vertex(this.vertices[0].x - edgeDifX4, this.vertices[0].y + edgeDifY4);
        let v41 = new Vertex(0, 0);
        let v42 = new Vertex(0, 0);

        if (Math.abs(pointToLineDistanceByVertices(this.vertices[0], this.vertices[3], v41a) - settings.subcellMargin) < Math.abs(pointToLineDistanceByVertices(this.vertices[0], this.vertices[3], v41b) - settings.subcellMargin)) {
            if (pointToLineDistanceByVertices(v41a, v42a, crossPoint) < pointToLineDistanceByVertices(v41c, v42c, crossPoint)) {
                v41.setVertex(v41a);
                v42.setVertex(v42a);
            }
            else {
                v41.setVertex(v41c);
                v42.setVertex(v42c);
            }
        }
        else {
            if (pointToLineDistanceByVertices(v41b, v42b, crossPoint) < pointToLineDistanceByVertices(v41d, v42d, crossPoint)) {
                v41.setVertex(v41b);
                v42.setVertex(v42b);
            }
            else {
                v41.setVertex(v41d);
                v42.setVertex(v42d);
            }
        }

        this.margin.push(findIntersection(v41, v42, v11, v12));
        this.margin.push(findIntersection(v11, v12, v21, v22));
        this.margin.push(findIntersection(v21, v22, v31, v32));
        this.margin.push(findIntersection(v31, v32, v41, v42));

        if (this.margin[0].equals(this.margin[1])) {
            this.margin[1].setX(this.margin[1].x + 1);
        }
        if (this.margin[1].equals(this.margin[2])) {
            this.margin[2].setY(this.margin[2].y + 1);
        }
        if (this.margin[2].equals(this.margin[3])) {
            this.margin[3].setX(this.margin[3].x - 1);
        }
        if (this.margin[3].equals(this.margin[0])) {
            this.margin[0].setY(this.margin[0].y - 1);
        }

        if (calculateDistance(this.margin[0], this.vertices[0]) > Math.min(calculateDistance(this.margin[1], this.vertices[0]), calculateDistance(this.margin[2], this.vertices[0]), calculateDistance(this.margin[3], this.vertices[0])) || calculateDistance(this.margin[1], this.vertices[1]) > Math.min(calculateDistance(this.margin[0], this.vertices[1]), calculateDistance(this.margin[2], this.vertices[1]), calculateDistance(this.margin[3], this.vertices[1])) || calculateDistance(this.margin[2], this.vertices[2]) > Math.min(calculateDistance(this.margin[0], this.vertices[2]), calculateDistance(this.margin[1], this.vertices[2]), calculateDistance(this.margin[3], this.vertices[2])) || calculateDistance(this.margin[3], this.vertices[3]) > Math.min(calculateDistance(this.margin[0], this.vertices[3]), calculateDistance(this.margin[1], this.vertices[3]), calculateDistance(this.margin[2], this.vertices[3]))) {
            this.type = 0;
        }

        if (!isPointWithinQuadrilateral(this.vertices, this.margin[0]) || !isPointWithinQuadrilateral(this.vertices, this.margin[1]) || !isPointWithinQuadrilateral(this.vertices, this.margin[2]) || !isPointWithinQuadrilateral(this.vertices, this.margin[3])) {
            this.type = 0;
        }
    }

    calculateInnerRectangle(baseV1, baseV2, otherV1, otherV2, color) {
        let v0 = new Vertex(baseV1.x, baseV1.y);
        let v1 = new Vertex(baseV2.x, baseV2.y);

        let v2 = new Vertex(baseV2.x - (baseV1.y - baseV2.y), baseV2.y + (baseV1.x - baseV2.x));
        let v3 = new Vertex(baseV1.x - (baseV2.y - baseV1.y), baseV1.y + (baseV2.x - baseV1.x));

        v2 = findIntersection(v1, v2, otherV1, otherV2);
        v3 = findIntersection(v0, v3, otherV1, otherV2);

        if (v2.x < Math.min(otherV1.x, otherV2.x) || Math.max(otherV1.x, otherV2.x) < v2.x) {
            v1.setX(v1.x + (otherV1.x - v2.x));
            v1.setY(v1.y + (otherV1.y - v2.y));
            v2.setVertex(otherV1);

            v1 = findIntersection(v1, v2, baseV1, baseV2);
        }

        if (v3.x < Math.min(otherV1.x, otherV2.x) || Math.max(otherV1.x, otherV2.x) < v3.x) {
            v0.setX(v0.x + (otherV2.x - v3.x));
            v0.setY(v0.y + (otherV2.y - v3.y));
            v3.setVertex(otherV2);

            v0 = findIntersection(v0, v3, baseV1, baseV2);
        }

        if (calculateDistance(v0, v3) < calculateDistance(v1, v2)) {
            v2 = findIntersection(v3, new Vertex(v3.x - (v0.y - v3.y), v3.y + (v0.x - v3.x)), v1, v2);
        }
        else {
            v3 = findIntersection(v2, new Vertex(v2.x - (v1.y - v2.y), v2.y + (v1.x - v2.x)), v0, v3);
        }

        if (calculateDistance(v0, this.margin[0]) > Math.min(calculateDistance(v1, this.margin[0]), calculateDistance(v2, this.margin[0]), calculateDistance(v3, this.margin[0])) || calculateDistance(v1, this.margin[1]) > Math.min(calculateDistance(v0, this.margin[1]), calculateDistance(v2, this.margin[1]), calculateDistance(v3, this.margin[1])) || calculateDistance(v2, this.margin[2]) > Math.min(calculateDistance(v0, this.margin[2]), calculateDistance(v1, this.margin[2]), calculateDistance(v3, this.margin[2])) || calculateDistance(v3, this.margin[3]) > Math.min(calculateDistance(v0, this.margin[3]), calculateDistance(v1, this.margin[3]), calculateDistance(v2, this.margin[3]))) {
            return null;
        }

        return {
            0: v0,
            1: v1,
            2: v2,
            3: v3
        };
    }

    getInnerRectangle() {
        this.innerRectangle = null;

        let rect1 = this.calculateInnerRectangle(this.margin[0], this.margin[1], this.margin[2], this.margin[3], 'red');
        let rect2 = this.calculateInnerRectangle(this.margin[1], this.margin[2], this.margin[3], this.margin[0], 'yellow');
        let rect3 = this.calculateInnerRectangle(this.margin[2], this.margin[3], this.margin[0], this.margin[1], 'green');
        let rect4 = this.calculateInnerRectangle(this.margin[3], this.margin[0], this.margin[1], this.margin[2], 'blue');

        let area1 = rect1 == null ? 0 : calculateDistance(rect1[0], rect1[1]) * calculateDistance(rect1[1], rect1[2]);
        let area2 = rect2 == null ? 0 : calculateDistance(rect2[0], rect2[1]) * calculateDistance(rect2[1], rect2[2]);
        let area3 = rect3 == null ? 0 : calculateDistance(rect3[0], rect3[1]) * calculateDistance(rect3[1], rect3[2]);
        let area4 = rect4 == null ? 0 : calculateDistance(rect4[0], rect4[1]) * calculateDistance(rect4[1], rect4[2]);

        if (area1 == Math.max(area1, area2, area3, area4) && rect1 != null) {
            this.innerRectangle = {
                0: rect1[0],
                1: rect1[1],
                2: rect1[2],
                3: rect1[3]
            };
        }
        else if (area2 == Math.max(area1, area2, area3, area4) && rect2 != null) {
            this.innerRectangle = {
                0: rect2[3],
                1: rect2[0],
                2: rect2[1],
                3: rect2[2]
            };
        }
        else if (area3 == Math.max(area1, area2, area3, area4) && rect3 != null) {
            this.innerRectangle = {
                0: rect3[2],
                1: rect3[3],
                2: rect3[0],
                3: rect3[1]
            };
        }
        else if (rect4 != null) {
            this.innerRectangle = {
                0: rect4[1],
                1: rect4[2],
                2: rect4[3],
                3: rect4[0]
            };
        }
        else {
            this.innerRectangle = null;
            return;
        }
    }

    shortenInnerRectangle() {
        if (this.innerRectangle == null) {
            return;
        }

        let shortenedRectangle = [];
        let shorten1 = 0;
        let shorten2 = 0;

        while ((1 - 2 * shorten1) * calculateDistance(this.innerRectangle[1], this.innerRectangle[2]) > 7 * settings.subcellMargin) {
            shorten1 += 0.05;
        }

        while ((1 - 2 * shorten2) * calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) > 7 * settings.subcellMargin) {
            shorten2 += 0.05;
        }

        for (let i in [0, 1, 2, 3]) {
            shortenedRectangle.push(new Vertex(this.innerRectangle[i].x, this.innerRectangle[i].y));
        }

        shortenedRectangle[0].setX(shortenedRectangle[0].x + shorten1 * (this.innerRectangle[2].x - this.innerRectangle[1].x));
        shortenedRectangle[0].setY(shortenedRectangle[0].y + shorten1 * (this.innerRectangle[2].y - this.innerRectangle[1].y));
        shortenedRectangle[0].setX(shortenedRectangle[0].x + shorten2 * (this.innerRectangle[1].x - this.innerRectangle[0].x));
        shortenedRectangle[0].setY(shortenedRectangle[0].y + shorten2 * (this.innerRectangle[1].y - this.innerRectangle[0].y));
        shortenedRectangle[1].setX(shortenedRectangle[1].x + shorten1 * (this.innerRectangle[2].x - this.innerRectangle[1].x));
        shortenedRectangle[1].setY(shortenedRectangle[1].y + shorten1 * (this.innerRectangle[2].y - this.innerRectangle[1].y));
        shortenedRectangle[1].setX(shortenedRectangle[1].x + shorten2 * (this.innerRectangle[0].x - this.innerRectangle[1].x));
        shortenedRectangle[1].setY(shortenedRectangle[1].y + shorten2 * (this.innerRectangle[0].y - this.innerRectangle[1].y));
        shortenedRectangle[2].setX(shortenedRectangle[2].x + shorten1 * (this.innerRectangle[1].x - this.innerRectangle[2].x));
        shortenedRectangle[2].setY(shortenedRectangle[2].y + shorten1 * (this.innerRectangle[1].y - this.innerRectangle[2].y));
        shortenedRectangle[2].setX(shortenedRectangle[2].x + shorten2 * (this.innerRectangle[0].x - this.innerRectangle[1].x));
        shortenedRectangle[2].setY(shortenedRectangle[2].y + shorten2 * (this.innerRectangle[0].y - this.innerRectangle[1].y));
        shortenedRectangle[3].setX(shortenedRectangle[3].x + shorten1 * (this.innerRectangle[1].x - this.innerRectangle[2].x));
        shortenedRectangle[3].setY(shortenedRectangle[3].y + shorten1 * (this.innerRectangle[1].y - this.innerRectangle[2].y));
        shortenedRectangle[3].setX(shortenedRectangle[3].x + shorten2 * (this.innerRectangle[1].x - this.innerRectangle[0].x));
        shortenedRectangle[3].setY(shortenedRectangle[3].y + shorten2 * (this.innerRectangle[1].y - this.innerRectangle[0].y));
    
        for (let i in [0, 1, 2, 3]) {
            this.innerRectangle[i].setVertex(shortenedRectangle[i]);
        }
    }

    draw() {
        if (this.type == 4) {
            this.drawGov();
        }
        if (this.type == 3) {
            this.drawChurch();
        }
        if (this.type == 2) {
            if (this.neighbourhood == 0) {
                this.drawOuterRingBuildings();
            }
            else {
                this.drawInnerRingBuildings();
            }
        }
        if (this.type == 1) {
            this.drawPark();
        }
        if (this.type == 0) {
            ctx.fillStyle = '#95a5a6';
            ctx.beginPath();
            ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
            for (const vertex of this.vertices) {
                ctx.lineTo(vertex.x, vertex.y);
            }
            ctx.closePath();
            ctx.fill();
        }

        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo((this.vertices[0].x + this.vertices[1].x) / 2, (this.vertices[0].y + this.vertices[1].y) / 2);
        for (let i = 1; i < 4; i++) {
            ctx.arcTo(this.vertices[i].x, this.vertices[i].y, this.vertices[i == 3 ? 0 : i + 1].x, this.vertices[i == 3 ? 0 : i + 1].y, 1);
        }
        ctx.arcTo(this.vertices[0].x, this.vertices[0].y, (this.vertices[0].x + this.vertices[1].x) / 2, (this.vertices[0].y + this.vertices[1].y) / 2, 1);
        ctx.closePath();
        ctx.stroke();
    }

    drawPark() {
        let trees = [];
        for (let x = Math.min(this.margin[0].x, this.margin[1].x, this.margin[2].x, this.margin[3].x); x < Math.max(this.margin[0].x, this.margin[1].x, this.margin[2].x, this.margin[3].x); x += 1.5 * settings.subcellMargin) {
            for (let y = Math.min(this.margin[0].y, this.margin[1].y, this.margin[2].y, this.margin[3].y); y < Math.max(this.margin[0].y, this.margin[1].y, this.margin[2].y, this.margin[3].y); y += 1.5 * settings.subcellMargin) {
                for (let i = 0; i < 5; i++) {
                    let tree = new Vertex(random(x + 0.2 * settings.subcellMargin, x + 1.3 * settings.subcellMargin), random(y + 0.2 * settings.subcellMargin, y + 1.3 * settings.subcellMargin));
                    if (isPointWithinQuadrilateral(this.margin, tree)) {
                        trees.push(new Tree(tree, randomFloat(0.2, 0.5) * settings.subcellMargin));
                        break;
                    }
                }
            }
        }

        ctx.fillStyle = '#7ec850';
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (const vertex of this.vertices) {
            ctx.lineTo(vertex.x, vertex.y);
        }
        ctx.closePath();
        ctx.fill();

        for (const tree of trees) {
            tree.draw();
        }
    }

    drawOuterRingBuildings() {
        let corners = [];
        let other = [];

        corners.push([]);
        corners[0].push(new Vertex(this.vertices[0].x, this.vertices[0].y));
        corners[0].push(findIntersection(this.vertices[0], this.vertices[1], this.margin[0], new Vertex(this.margin[0].x - (this.margin[1].y - this.margin[0].y), this.margin[0].y + (this.margin[1].x - this.margin[0].x))));
        corners[0].push(new Vertex(this.margin[0].x, this.margin[0].y));
        corners[0].push(findIntersection(this.vertices[0], this.vertices[3], this.margin[0], new Vertex(this.margin[0].x - (this.margin[3].y - this.margin[0].y), this.margin[0].y + (this.margin[3].x - this.margin[0].x))));

        corners.push([]);
        corners[1].push(findIntersection(this.vertices[0], this.vertices[1], this.margin[1], new Vertex(this.margin[1].x - (this.margin[0].y - this.margin[1].y), this.margin[1].y + (this.margin[0].x - this.margin[1].x))));
        corners[1].push(new Vertex(this.vertices[1].x, this.vertices[1].y));
        corners[1].push(findIntersection(this.vertices[1], this.vertices[2], this.margin[1], new Vertex(this.margin[1].x - (this.margin[2].y - this.margin[1].y), this.margin[1].y + (this.margin[2].x - this.margin[1].x))));
        corners[1].push(new Vertex(this.margin[1].x, this.margin[1].y));

        corners.push([]);
        corners[2].push(new Vertex(this.margin[2].x, this.margin[2].y));
        corners[2].push(findIntersection(this.vertices[1], this.vertices[2], this.margin[2], new Vertex(this.margin[2].x - (this.margin[1].y - this.margin[2].y), this.margin[2].y + (this.margin[1].x - this.margin[2].x))));
        corners[2].push(new Vertex(this.vertices[2].x, this.vertices[2].y));
        corners[2].push(findIntersection(this.vertices[2], this.vertices[3], this.margin[2], new Vertex(this.margin[2].x - (this.margin[3].y - this.margin[2].y), this.margin[2].y + (this.margin[3].x - this.margin[2].x))));

        corners.push([]);
        corners[3].push(findIntersection(this.vertices[0], this.vertices[3], this.margin[3], new Vertex(this.margin[3].x - (this.margin[0].y - this.margin[3].y), this.margin[3].y + (this.margin[0].x - this.margin[3].x))));
        corners[3].push(new Vertex(this.margin[3].x, this.margin[3].y));
        corners[3].push(findIntersection(this.vertices[2], this.vertices[3], this.margin[3], new Vertex(this.margin[3].x - (this.margin[2].y - this.margin[3].y), this.margin[3].y + (this.margin[2].x - this.margin[3].x))));
        corners[3].push(new Vertex(this.vertices[3].x, this.vertices[3].y));

        other.push([]);
        other.push([]);
        other.push([]);
        other.push([]);
        
        let houseV0 = new Vertex(corners[0][1].x, corners[0][1].y);
        let houseV1 = new Vertex(0, 0);
        let houseV2 = new Vertex(0, 0);
        let houseV3 = new Vertex(this.margin[0].x, this.margin[0].y);

        while (calculateDistance(houseV0, corners[1][0]) > settings.subcellMargin) {
            let houseWidth = randomFloat(0.5, Math.min(1, calculateDistance(houseV0, corners[1][0]) / settings.subcellMargin - 0.5));
            let houseDepth = randomFloat(0.6, 1);
            let difX = houseWidth * (this.vertices[1].x - this.vertices[0].x) * settings.subcellMargin / calculateDistance(this.vertices[0], this.vertices[1]);
            let difY = houseWidth * (this.vertices[1].y - this.vertices[0].y) * settings.subcellMargin / calculateDistance(this.vertices[0], this.vertices[1]);
            
            houseV3.setVertex(new Vertex(houseV0.x + houseDepth * (this.margin[0].x - corners[0][1].x), houseV0.y + houseDepth * (this.margin[0].y - corners[0][1].y)));

            houseV1 = new Vertex(houseV0.x + difX, houseV0.y + difY);
            houseV2 = new Vertex(houseV3.x + difX, houseV3.y + difY);
            
            other[0].push([]);
            other[0][other[0].length - 1].push(new Vertex(houseV0.x, houseV0.y));
            other[0][other[0].length - 1].push(new Vertex(houseV1.x, houseV1.y));
            other[0][other[0].length - 1].push(new Vertex(houseV2.x, houseV2.y));
            other[0][other[0].length - 1].push(new Vertex(houseV3.x, houseV3.y));

            houseV0.setVertex(houseV1);
        }

        let depth = randomFloat(0.6, 1);
        other[0].push([]);
        other[0][other[0].length - 1].push(new Vertex(houseV0.x, houseV0.y));
        other[0][other[0].length - 1].push(new Vertex(corners[1][0].x, corners[1][0].y));
        other[0][other[0].length - 1].push(new Vertex(corners[1][0].x + depth * (corners[1][3].x - corners[1][0].x), corners[1][0].y + depth * (corners[1][3].y - corners[1][0].y)));
        other[0][other[0].length - 1].push(new Vertex(houseV0.x + depth * (this.margin[0].x - corners[0][1].x), houseV0.y + depth * (this.margin[0].y - corners[0][1].y)));

        houseV0 = new Vertex(this.margin[1].x, this.margin[1].y);
        houseV1 = new Vertex(corners[1][2].x, corners[1][2].y);
        houseV2 = new Vertex(0, 0);
        houseV3 = new Vertex(0, 0);

        while (calculateDistance(houseV1, corners[2][1]) > settings.subcellMargin) {
            let houseWidth = randomFloat(0.5, Math.min(1, calculateDistance(houseV1, corners[2][1]) / settings.subcellMargin - 0.5));
            let houseDepth = randomFloat(0.6, 1);
            let difX = houseWidth * (this.vertices[2].x - this.vertices[1].x) * settings.subcellMargin / calculateDistance(this.vertices[1], this.vertices[2]);
            let difY = houseWidth * (this.vertices[2].y - this.vertices[1].y) * settings.subcellMargin / calculateDistance(this.vertices[1], this.vertices[2]);
            
            houseV0.setVertex(new Vertex(houseV1.x + houseDepth * (this.margin[1].x - corners[1][2].x), houseV1.y + houseDepth * (this.margin[1].y - corners[1][2].y)));

            houseV2 = new Vertex(houseV1.x + difX, houseV1.y + difY);
            houseV3 = new Vertex(houseV0.x + difX, houseV0.y + difY);
            
            other[1].push([]);
            other[1][other[1].length - 1].push(new Vertex(houseV0.x, houseV0.y));
            other[1][other[1].length - 1].push(new Vertex(houseV1.x, houseV1.y));
            other[1][other[1].length - 1].push(new Vertex(houseV2.x, houseV2.y));
            other[1][other[1].length - 1].push(new Vertex(houseV3.x, houseV3.y));

            houseV1.setVertex(houseV2);
        }

        depth = randomFloat(0.6, 1);
        other[1].push([]);
        other[1][other[1].length - 1].push(new Vertex(houseV1.x + depth * (this.margin[1].x - corners[1][2].x), houseV1.y + depth * (this.margin[1].y - corners[1][2].y)));
        other[1][other[1].length - 1].push(new Vertex(houseV1.x, houseV1.y));
        other[1][other[1].length - 1].push(new Vertex(corners[2][1].x, corners[2][1].y));
        other[1][other[1].length - 1].push(new Vertex(corners[2][1].x + depth * (corners[2][0].x - corners[2][1].x), corners[2][1].y + depth * (corners[2][0].y - corners[2][1].y)));

        houseV0 = new Vertex(this.margin[3].x, this.margin[3].y);
        houseV1 = new Vertex(0, 0);
        houseV2 = new Vertex(0, 0);
        houseV3 = new Vertex(corners[3][2].x, corners[3][2].y);

        while (calculateDistance(houseV3, corners[2][3]) > settings.subcellMargin) {
            let houseWidth = randomFloat(0.5, Math.min(1, calculateDistance(houseV3, corners[2][3]) / settings.subcellMargin - 0.5));
            let houseDepth = randomFloat(0.6, 1);
            let difX = houseWidth * (this.vertices[2].x - this.vertices[3].x) * settings.subcellMargin / calculateDistance(this.vertices[2], this.vertices[3]);
            let difY = houseWidth * (this.vertices[2].y - this.vertices[3].y) * settings.subcellMargin / calculateDistance(this.vertices[2], this.vertices[3]);
            
            houseV0.setVertex(new Vertex(houseV3.x + houseDepth * (this.margin[3].x - corners[3][2].x), houseV3.y + houseDepth * (this.margin[3].y - corners[3][2].y)));

            houseV1 = new Vertex(houseV0.x + difX, houseV0.y + difY);
            houseV2 = new Vertex(houseV3.x + difX, houseV3.y + difY);
            
            other[3].push([]);
            other[3][other[3].length - 1].push(new Vertex(houseV0.x, houseV0.y));
            other[3][other[3].length - 1].push(new Vertex(houseV1.x, houseV1.y));
            other[3][other[3].length - 1].push(new Vertex(houseV2.x, houseV2.y));
            other[3][other[3].length - 1].push(new Vertex(houseV3.x, houseV3.y));

            houseV3.setVertex(houseV2);
        }

        depth = randomFloat(0.6, 1);
        other[3].push([]);
        other[3][other[3].length - 1].push(new Vertex(houseV3.x + depth * (this.margin[3].x - corners[3][2].x), houseV3.y + depth * (this.margin[3].y - corners[3][2].y)));
        other[3][other[3].length - 1].push(new Vertex(corners[2][3].x + depth * (this.margin[3].x - corners[3][2].x), corners[2][3].y + depth * (this.margin[3].y - corners[3][2].y)));
        other[3][other[3].length - 1].push(new Vertex(corners[2][3].x, corners[2][3].y));
        other[3][other[3].length - 1].push(new Vertex(houseV3.x, houseV3.y));

        houseV0 = new Vertex(corners[0][3].x, corners[0][3].y);
        houseV1 = new Vertex(this.margin[0].x, this.margin[0].y);
        houseV2 = new Vertex(0, 0);
        houseV3 = new Vertex(0, 0);

        while (calculateDistance(houseV0, corners[3][0]) > settings.subcellMargin) {
            let houseWidth = randomFloat(0.5, Math.min(1, calculateDistance(houseV0, corners[3][0]) / settings.subcellMargin - 0.5));
            let houseDepth = randomFloat(0.6, 1);
            let difX = houseWidth * (this.vertices[3].x - this.vertices[0].x) * settings.subcellMargin / calculateDistance(this.vertices[0], this.vertices[3]);
            let difY = houseWidth * (this.vertices[3].y - this.vertices[0].y) * settings.subcellMargin / calculateDistance(this.vertices[0], this.vertices[3]);
            
            houseV1.setVertex(new Vertex(houseV0.x + houseDepth * (this.margin[3].x - corners[3][0].x), houseV0.y + houseDepth * (this.margin[3].y - corners[3][0].y)));

            houseV2 = new Vertex(houseV1.x + difX, houseV1.y + difY);
            houseV3 = new Vertex(houseV0.x + difX, houseV0.y + difY);
            
            other[3].push([]);
            other[3][other[3].length - 1].push(new Vertex(houseV0.x, houseV0.y));
            other[3][other[3].length - 1].push(new Vertex(houseV1.x, houseV1.y));
            other[3][other[3].length - 1].push(new Vertex(houseV2.x, houseV2.y));
            other[3][other[3].length - 1].push(new Vertex(houseV3.x, houseV3.y));

            houseV0.setVertex(houseV3);
        }

        depth = randomFloat(0.6, 1);
        other[3].push([]);
        other[3][other[3].length - 1].push(new Vertex(houseV0.x, houseV0.y));
        other[3][other[3].length - 1].push(new Vertex(houseV0.x + depth * (this.margin[3].x - corners[3][0].x), houseV0.y + depth * (this.margin[3].y - corners[3][0].y)));
        other[3][other[3].length - 1].push(new Vertex(corners[3][0].x + depth * (this.margin[3].x - corners[3][0].x), corners[3][0].y + depth * (this.margin[3].y - corners[3][0].y)));
        other[3][other[3].length - 1].push(new Vertex(corners[3][0].x, corners[3][0].y));

        let trees = [];
        for (let x = Math.min(this.margin[0].x, this.margin[1].x, this.margin[2].x, this.margin[3].x); x < Math.max(this.margin[0].x, this.margin[1].x, this.margin[2].x, this.margin[3].x); x += 2.5 * settings.subcellMargin) {
            for (let y = Math.min(this.margin[0].y, this.margin[1].y, this.margin[2].y, this.margin[3].y); y < Math.max(this.margin[0].y, this.margin[1].y, this.margin[2].y, this.margin[3].y); y += 2.5 * settings.subcellMargin) {
                for (let i = 0; i < 5; i++) {
                    let tree = new Vertex(random(x + 0.2 * settings.subcellMargin, x + 2.3 * settings.subcellMargin), random(y + 0.2 * settings.subcellMargin, y + 2.3 * settings.subcellMargin));
                    if (isPointWithinQuadrilateral(this.margin, tree)) {
                        trees.push(new Tree(tree, randomFloat(0.2, 0.5) * settings.subcellMargin));
                        break;
                    }
                }
            }
        }

        ctx.fillStyle = '#95a5a6';
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (const vertex of this.vertices) {
            ctx.lineTo(vertex.x, vertex.y);
        }
        ctx.closePath();
        ctx.fill();

        for (const cornerHouse of corners) {
            ctx.fillStyle = randomRGB(160, 255, 64, 95, 64, 95);
            ctx.beginPath();
            ctx.moveTo(cornerHouse[0].x, cornerHouse[0].y);
            for (const vertex of cornerHouse) {
                ctx.lineTo(vertex.x, vertex.y);
            }
            ctx.closePath();
            ctx.fill();
        }

        for (const houseRow of other) {
            for (const house of houseRow) {
                ctx.fillStyle = randomRGB(160, 255, 64, 95, 64, 95);
                ctx.beginPath();
                ctx.moveTo(house[0].x, house[0].y);
                for (const vertex of house) {
                    ctx.lineTo(vertex.x, vertex.y);
                }
                ctx.closePath();
                ctx.fill();
            }
        }
        
        ctx.strokeStyle = '#aa4a44';
        ctx.lineWidth = 1;
        
        for (const cornerHouse of corners) {
            ctx.beginPath();
            ctx.moveTo(cornerHouse[0].x, cornerHouse[0].y);
            for (const vertex of cornerHouse) {
                ctx.lineTo(vertex.x, vertex.y);
            }
            ctx.closePath();
            ctx.stroke();
        }

        for (const houseRow of other) {
            for (const house of houseRow) {
                ctx.beginPath();
                ctx.moveTo(house[0].x, house[0].y);
                for (const vertex of house) {
                    ctx.lineTo(vertex.x, vertex.y);
                }
                ctx.closePath();
                ctx.stroke();
            }
        }

        for (const tree of trees) {
            tree.draw();
        }
    }

    drawInnerRingBuildings() {
        this.getInnerRectangle();

        if (this.innerRectangle == null) {
            this.type = 1;
            return;
        }

        if (calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) < settings.subcellMargin || calculateDistance(this.innerRectangle[1], this.innerRectangle[2]) < settings.subcellMargin) {
            this.type = 1;
            return;
        }

        let buildings = [];
        let buildingWidth = randomFloat(0.6, 1) * settings.subcellMargin;
        let lawnWidth = randomFloat(1 * buildingWidth, 1.5 * buildingWidth);

        let v0;
        let v1;
        let v2;
        let v3;
        let lawnX;
        let lawnY;
        let buildX;
        let buildY;

        let p0;
        let p1;
        let p2;
        let p3;
        
        if (calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) > calculateDistance(this.innerRectangle[0], this.innerRectangle[3])) {
            v0 = new Vertex(this.innerRectangle[0].x, this.innerRectangle[0].y);
            v1 = new Vertex(this.innerRectangle[3].x, this.innerRectangle[3].y);
            v2 = new Vertex(this.innerRectangle[1].x, this.innerRectangle[1].y);
            v3 = new Vertex(this.innerRectangle[2].x, this.innerRectangle[2].y);

            lawnX = (this.innerRectangle[1].x - this.innerRectangle[0].x) * lawnWidth / calculateDistance(this.innerRectangle[0], this.innerRectangle[1]);
            lawnY = (this.innerRectangle[1].y - this.innerRectangle[0].y) * lawnWidth / calculateDistance(this.innerRectangle[0], this.innerRectangle[1]);
            buildX = (this.innerRectangle[1].x - this.innerRectangle[0].x) * buildingWidth / calculateDistance(this.innerRectangle[0], this.innerRectangle[1]);
            buildY = (this.innerRectangle[1].y - this.innerRectangle[0].y) * buildingWidth / calculateDistance(this.innerRectangle[0], this.innerRectangle[1]);
            
            p0 = findIntersection(v0, v2, this.vertices[0], this.vertices[3]);
            p1 = findIntersection(v0, v2, this.vertices[1], this.vertices[2]);
            p2 = findIntersection(v1, v3, this.vertices[0], this.vertices[3]);
            p3 = findIntersection(v1, v3, this.vertices[1], this.vertices[2]);
        }
        else {
            v0 = new Vertex(this.innerRectangle[0].x, this.innerRectangle[0].y);
            v1 = new Vertex(this.innerRectangle[1].x, this.innerRectangle[1].y);
            v2 = new Vertex(this.innerRectangle[3].x, this.innerRectangle[3].y);
            v3 = new Vertex(this.innerRectangle[2].x, this.innerRectangle[2].y);
            
            lawnX = (this.innerRectangle[3].x - this.innerRectangle[0].x) * lawnWidth / calculateDistance(this.innerRectangle[0], this.innerRectangle[3]);
            lawnY = (this.innerRectangle[3].y - this.innerRectangle[0].y) * lawnWidth / calculateDistance(this.innerRectangle[0], this.innerRectangle[3]);
            buildX = (this.innerRectangle[3].x - this.innerRectangle[0].x) * buildingWidth / calculateDistance(this.innerRectangle[0], this.innerRectangle[3]);
            buildY = (this.innerRectangle[3].y - this.innerRectangle[0].y) * buildingWidth / calculateDistance(this.innerRectangle[0], this.innerRectangle[3]);
            
            p0 = findIntersection(v0, v2, this.vertices[0], this.vertices[1]);
            p1 = findIntersection(v0, v2, this.vertices[2], this.vertices[3]);
            p2 = findIntersection(v1, v3, this.vertices[0], this.vertices[1]);
            p3 = findIntersection(v1, v3, this.vertices[2], this.vertices[3]);
        }

        let totalX = 0;
        let totalY = 0;

        for (let i = 0; Math.abs(totalX + buildX) <= Math.abs(v2.x - v0.x) && Math.abs(totalY + buildY) <= Math.abs(v2.y - v0.y); i++) {
            buildings.push([]);
            buildings[i].push(new Vertex(v0.x + totalX, v0.y + totalY));
            buildings[i].push(new Vertex(v0.x + totalX + buildX, v0.y + totalY + buildY));
            buildings[i].push(new Vertex(v1.x + totalX + buildX, v1.y + totalY + buildY));
            buildings[i].push(new Vertex(v1.x + totalX, v1.y + totalY));
            totalX += buildX + lawnX;
            totalY += buildY + lawnY;
        }

        let trees = [];
        for (let x = Math.min(this.margin[0].x, this.margin[1].x, this.margin[2].x, this.margin[3].x); x < Math.max(this.margin[0].x, this.margin[1].x, this.margin[2].x, this.margin[3].x); x += 2 * settings.subcellMargin) {
            for (let y = Math.min(this.margin[0].y, this.margin[1].y, this.margin[2].y, this.margin[3].y); y < Math.max(this.margin[0].y, this.margin[1].y, this.margin[2].y, this.margin[3].y); y += 2 * settings.subcellMargin) {
                for (let i = 0; i < 5; i++) {
                    let tree = new Vertex(random(x + 0.2 * settings.subcellMargin, x + 1.8 * settings.subcellMargin), random(y + 0.2 * settings.subcellMargin, y + 1.8 * settings.subcellMargin));
                    
                    let inBuilding = false;
                    for (const building of buildings) {
                        if (isPointWithinQuadrilateral(building, tree)) {
                            inBuilding = true;
                        }
                    }
                    
                    if (isPointWithinQuadrilateral(this.margin, tree) && !inBuilding) {
                        trees.push(new Tree(tree, randomFloat(0.2, 0.5) * settings.subcellMargin));
                        break;
                    }
                }
            }
        }

        ctx.fillStyle = '#95a5a6';
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (const vertex of this.vertices) {
            ctx.lineTo(vertex.x, vertex.y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#7ec850';
        ctx.strokeStyle = '#7ec850';
        ctx.lineWidth = 0.75 * settings.subcellMargin;
        ctx.beginPath();
        ctx.moveTo(this.innerRectangle[0].x, this.innerRectangle[0].y);
        for (let i in [0, 1, 2, 3]) {
            ctx.lineTo(this.innerRectangle[i].x, this.innerRectangle[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#b7ada3';
        ctx.lineWidth = 1.5 * settings.roadWidth;
        for (const building of buildings) {
            ctx.beginPath();
            ctx.moveTo(building[0].x, building[0].y);
            ctx.lineTo(building[3].x, building[3].y);
            ctx.stroke();
        }

        ctx.lineWidth = 0.75 * settings.roadWidth;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.stroke();
        
        ctx.fillStyle = '#808076';
        ctx.strokeStyle = '#66665e';
        ctx.lineWidth = 2;
        for (const building of buildings) {
            ctx.beginPath();
            ctx.moveTo(building[0].x, building[0].y);
            for (const vertex of building) {
                ctx.lineTo(vertex.x, vertex.y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        for (const tree of trees) {
            tree.draw();
        }
    }

    drawChurch() {
        this.getInnerRectangle();
        this.shortenInnerRectangle();

        if (this.innerRectangle == null) {
            this.type = 1;
            return;
        }

        if (calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) < 2 * settings.subcellMargin || calculateDistance(this.innerRectangle[1], this.innerRectangle[2]) < 2 * settings.subcellMargin) {
            this.type = 1;
            return;
        }

        let church = [];
        let v0;
        let v1;
        let v2;
        let v3;
        let pathSource;
        let pathDest;

        if (Math.abs(calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) - calculateDistance(this.innerRectangle[1], this.innerRectangle[2])) < settings.subcellMargin) {
            v0 = new Vertex((this.innerRectangle[0].x + this.innerRectangle[1].x) / 2, (this.innerRectangle[0].y + this.innerRectangle[1].y) / 2);
            v1 = new Vertex((this.innerRectangle[1].x + this.innerRectangle[2].x) / 2, (this.innerRectangle[1].y + this.innerRectangle[2].y) / 2);
            v2 = new Vertex((this.innerRectangle[2].x + this.innerRectangle[3].x) / 2, (this.innerRectangle[2].y + this.innerRectangle[3].y) / 2);
            v3 = new Vertex((this.innerRectangle[0].x + this.innerRectangle[3].x) / 2, (this.innerRectangle[0].y + this.innerRectangle[3].y) / 2);
            
            if (calculateDistance(v0, findIntersection(v0, v2, this.vertices[0], this.vertices[1])) < Math.min(calculateDistance(v1, findIntersection(v1, v3, this.vertices[1], this.vertices[2])), calculateDistance(v2, findIntersection(v0, v2, this.vertices[2], this.vertices[3])), calculateDistance(v3, findIntersection(v1, v3, this.vertices[0], this.vertices[3])))) {
                pathSource = new Vertex(v0.x, v0.y);
                pathDest = findIntersection(v0, v2, this.vertices[0], this.vertices[1]);
            }
            else if (calculateDistance(v1, findIntersection(v1, v3, this.vertices[1], this.vertices[2])) < Math.min(calculateDistance(v0, findIntersection(v0, v2, this.vertices[0], this.vertices[1])), calculateDistance(v2, findIntersection(v0, v2, this.vertices[2], this.vertices[3])), calculateDistance(v3, findIntersection(v1, v3, this.vertices[0], this.vertices[3])))) {
                pathSource = new Vertex(v1.x, v1.y);
                pathDest = findIntersection(v1, v3, this.vertices[1], this.vertices[2]);
            }
            else if (calculateDistance(v2, findIntersection(v0, v2, this.vertices[2], this.vertices[3])) < Math.min(calculateDistance(v0, findIntersection(v0, v2, this.vertices[0], this.vertices[1])), calculateDistance(v1, findIntersection(v1, v3, this.vertices[1], this.vertices[2])), calculateDistance(v3, findIntersection(v1, v3, this.vertices[0], this.vertices[3])))) {
                pathSource = new Vertex(v2.x, v2.y);
                pathDest = findIntersection(v0, v2, this.vertices[2], this.vertices[3]);
            }
            else {
                pathSource = new Vertex(v3.x, v3.y);
                pathDest = findIntersection(v1, v3, this.vertices[0], this.vertices[3]);
            }
        }
        else if (calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) < calculateDistance(this.innerRectangle[1], this.innerRectangle[2])) {
            let crossProp = randomFloat(0.3, 0.7);
            v0 = new Vertex((this.innerRectangle[0].x + this.innerRectangle[1].x) / 2, (this.innerRectangle[0].y + this.innerRectangle[1].y) / 2);
            v1 = new Vertex(this.innerRectangle[1].x + crossProp * (this.innerRectangle[2].x - this.innerRectangle[1].x), this.innerRectangle[1].y + crossProp * (this.innerRectangle[2].y - this.innerRectangle[1].y));
            v2 = new Vertex((this.innerRectangle[2].x + this.innerRectangle[3].x) / 2, (this.innerRectangle[2].y + this.innerRectangle[3].y) / 2);
            v3 = new Vertex(this.innerRectangle[0].x + crossProp * (this.innerRectangle[3].x - this.innerRectangle[0].x), this.innerRectangle[0].y + crossProp * (this.innerRectangle[3].y - this.innerRectangle[0].y));
            
            if (calculateDistance(v0, findIntersection(v0, v2, this.vertices[0], this.vertices[1])) < calculateDistance(v2, findIntersection(v0, v2, this.vertices[2], this.vertices[3]))) {
                pathSource = new Vertex(v0.x, v0.y);
                pathDest = findIntersection(v0, v2, this.vertices[0], this.vertices[1]);
            }
            else {
                pathSource = new Vertex(v2.x, v2.y);
                pathDest = findIntersection(v0, v2, this.vertices[2], this.vertices[3]);
            }
        }
        else {
            let crossProp = randomFloat(0.3, 0.7);
            v0 = new Vertex(this.innerRectangle[0].x + crossProp * (this.innerRectangle[1].x - this.innerRectangle[0].x), this.innerRectangle[0].y + crossProp * (this.innerRectangle[1].y - this.innerRectangle[0].y));
            v1 = new Vertex((this.innerRectangle[1].x + this.innerRectangle[2].x) / 2, (this.innerRectangle[1].y + this.innerRectangle[2].y) / 2);
            v2 = new Vertex(this.innerRectangle[3].x + crossProp * (this.innerRectangle[2].x - this.innerRectangle[3].x), this.innerRectangle[3].y + crossProp * (this.innerRectangle[2].y - this.innerRectangle[3].y));
            v3 = new Vertex((this.innerRectangle[0].x + this.innerRectangle[3].x) / 2, (this.innerRectangle[0].y + this.innerRectangle[3].y) / 2);
            
            if (calculateDistance(v1, findIntersection(v1, v3, this.vertices[1], this.vertices[2])) < calculateDistance(v3, findIntersection(v1, v3, this.vertices[0], this.vertices[3]))) {
                pathSource = new Vertex(v1.x, v1.y);
                pathDest = findIntersection(v1, v3, this.vertices[1], this.vertices[2]);
            }
            else {
                pathSource = new Vertex(v3.x, v3.y);
                pathDest = findIntersection(v1, v3, this.vertices[0], this.vertices[3]);
            }
        }

        let churchWidth = random(Math.min(settings.subcellMargin, 0.5 * Math.min(calculateDistance(v0, this.innerRectangle[0]), calculateDistance(v0, this.innerRectangle[1]), calculateDistance(v1, this.innerRectangle[1]), calculateDistance(v1, this.innerRectangle[2]))), Math.min(2 * settings.subcellMargin, 0.6 * Math.min(calculateDistance(v0, this.innerRectangle[0]), calculateDistance(v0, this.innerRectangle[1]), calculateDistance(v1, this.innerRectangle[1]), calculateDistance(v1, this.innerRectangle[2]))));

        church.push(new Vertex(v0.x + (this.innerRectangle[0].x - v0.x) * churchWidth / calculateDistance(v0, this.innerRectangle[0]), v0.y + (this.innerRectangle[0].y - v0.y) * churchWidth / calculateDistance(v0, this.innerRectangle[0])));
        church.push(new Vertex(v0.x + (this.innerRectangle[1].x - v0.x) * churchWidth / calculateDistance(v0, this.innerRectangle[1]), v0.y + (this.innerRectangle[1].y - v0.y) * churchWidth / calculateDistance(v0, this.innerRectangle[1])));
        church.push(null);
        church.push(new Vertex(v1.x + (this.innerRectangle[1].x - v1.x) * churchWidth / calculateDistance(v1, this.innerRectangle[1]), v1.y + (this.innerRectangle[1].y - v1.y) * churchWidth / calculateDistance(v1, this.innerRectangle[1])));
        church.push(new Vertex(v1.x + (this.innerRectangle[2].x - v1.x) * churchWidth / calculateDistance(v1, this.innerRectangle[2]), v1.y + (this.innerRectangle[2].y - v1.y) * churchWidth / calculateDistance(v1, this.innerRectangle[2])));
        church.push(null);
        church.push(new Vertex(v2.x + (this.innerRectangle[2].x - v2.x) * churchWidth / calculateDistance(v2, this.innerRectangle[2]), v2.y + (this.innerRectangle[2].y - v2.y) * churchWidth / calculateDistance(v2, this.innerRectangle[2])));
        church.push(new Vertex(v2.x + (this.innerRectangle[3].x - v2.x) * churchWidth / calculateDistance(v2, this.innerRectangle[3]), v2.y + (this.innerRectangle[3].y - v2.y) * churchWidth / calculateDistance(v2, this.innerRectangle[3])));
        church.push(null);
        church.push(new Vertex(v3.x + (this.innerRectangle[3].x - v3.x) * churchWidth / calculateDistance(v3, this.innerRectangle[3]), v3.y + (this.innerRectangle[3].y - v3.y) * churchWidth / calculateDistance(v3, this.innerRectangle[3])));
        church.push(new Vertex(v3.x + (this.innerRectangle[0].x - v3.x) * churchWidth / calculateDistance(v3, this.innerRectangle[0]), v3.y + (this.innerRectangle[0].y - v3.y) * churchWidth / calculateDistance(v3, this.innerRectangle[0])));
        church.push(null);

        church[2] = findIntersection(church[1], church[6], church[3], church[10]);
        church[5] = findIntersection(church[1], church[6], church[4], church[9]);
        church[8] = findIntersection(church[0], church[7], church[4], church[9]);
        church[11] = findIntersection(church[0], church[7], church[3], church[10]);

        let trees = [];
        for (let x = Math.min(this.margin[0].x, this.margin[1].x, this.margin[2].x, this.margin[3].x); x < Math.max(this.margin[0].x, this.margin[1].x, this.margin[2].x, this.margin[3].x); x += 2 * settings.subcellMargin) {
            for (let y = Math.min(this.margin[0].y, this.margin[1].y, this.margin[2].y, this.margin[3].y); y < Math.max(this.margin[0].y, this.margin[1].y, this.margin[2].y, this.margin[3].y); y += 2 * settings.subcellMargin) {
                for (let i = 0; i < 5; i++) {
                    let tree = new Vertex(random(x + 0.2 * settings.subcellMargin, x + 1.8 * settings.subcellMargin), random(y + 0.2 * settings.subcellMargin, y + 1.8 * settings.subcellMargin));
                    if (isPointWithinQuadrilateral(this.margin, tree) && !isPointWithinQuadrilateral([church[0], church[1], church[6], church[7]], tree) && !isPointWithinQuadrilateral([church[10], church[3], church[4], church[9]], tree)) {
                        trees.push(new Tree(tree, randomFloat(0.2, 0.5) * settings.subcellMargin));
                        break;
                    }
                }
            }
        }

        let center = findIntersection(v0, v2, v1, v3);

        ctx.fillStyle = '#7ec850';
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (const vertex of this.vertices) {
            ctx.lineTo(vertex.x, vertex.y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#95a5a6';
        ctx.beginPath();
        ctx.moveTo(this.innerRectangle[0].x, this.innerRectangle[0].y);
        ctx.lineTo(this.innerRectangle[1].x, this.innerRectangle[1].y);
        ctx.lineTo(this.innerRectangle[2].x, this.innerRectangle[2].y);
        ctx.lineTo(this.innerRectangle[3].x, this.innerRectangle[3].y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo((this.innerRectangle[0].x + this.innerRectangle[1].x) / 2, (this.innerRectangle[0].y + this.innerRectangle[1].y) / 2);
        ctx.arcTo(this.innerRectangle[1].x, this.innerRectangle[1].y, this.innerRectangle[2].x, this.innerRectangle[2].y, 5);
        ctx.arcTo(this.innerRectangle[2].x, this.innerRectangle[2].y, this.innerRectangle[3].x, this.innerRectangle[3].y, 5);
        ctx.arcTo(this.innerRectangle[3].x, this.innerRectangle[3].y, this.innerRectangle[0].x, this.innerRectangle[0].y, 5);
        ctx.arcTo(this.innerRectangle[0].x, this.innerRectangle[0].y, (this.innerRectangle[0].x + this.innerRectangle[1].x) / 2, (this.innerRectangle[0].y + this.innerRectangle[1].y) / 2, 5);
        ctx.closePath();
        ctx.stroke();
        
        ctx.strokeStyle = '#e7bf7b';
        ctx.lineWidth = settings.roadWidth;
        ctx.beginPath();
        ctx.moveTo(pathSource.x, pathSource.y);
        ctx.lineTo(pathDest.x, pathDest.y);
        ctx.stroke();

        ctx.fillStyle = '#a65a4c';
        ctx.beginPath();
        ctx.moveTo(church[0].x, church[0].y);
        for (const vertex of church) {
            ctx.lineTo(vertex.x, vertex.y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#85483d';
        ctx.beginPath();
        ctx.moveTo(church[0].x, church[0].y);
        ctx.lineTo(v0.x, v0.y);
        ctx.lineTo(center.x, center.y);
        ctx.lineTo(church[11].x, church[11].y);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(v3.x, v3.y);
        ctx.lineTo(center.x, center.y);
        ctx.lineTo(v2.x, v2.y);
        ctx.lineTo(church[7].x, church[7].y);
        ctx.lineTo(church[8].x, church[8].y);
        ctx.lineTo(church[9].x, church[9].y);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(v1.x, v1.y);
        ctx.lineTo(church[4].x, church[4].y);
        ctx.lineTo(church[5].x, church[5].y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#7e4d44';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(church[0].x, church[0].y);
        for (const vertex of church) {
            ctx.lineTo(vertex.x, vertex.y);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(v0.x, v0.y);
        ctx.lineTo(v2.x, v2.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(v1.x, v1.y);
        ctx.lineTo(v3.x, v3.y);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(church[2].x, church[2].y);
        ctx.lineTo(center.x, center.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(church[5].x, church[5].y);
        ctx.lineTo(center.x, center.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(church[8].x, church[8].y);
        ctx.lineTo(center.x, center.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(church[11].x, church[11].y);
        ctx.lineTo(center.x, center.y);
        ctx.stroke();

        for (const tree of trees) {
            tree.draw();
        }
    }

    drawGov() {
        this.getInnerRectangle();
        this.shortenInnerRectangle();

        if (this.innerRectangle == null) {
            this.type = 2;
            return;
        }

        if (calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) < 2 * settings.subcellMargin || calculateDistance(this.innerRectangle[1], this.innerRectangle[2]) < 2 * settings.subcellMargin) {
            this.type = 2;
            return;
        }

        let govBuilding = [];
        let govWidth = random(Math.min(1.5 * settings.subcellMargin, 0.5 * Math.min(calculateDistance(this.innerRectangle[0], this.innerRectangle[1]), calculateDistance(this.innerRectangle[1], this.innerRectangle[2]))), Math.min(3 * settings.subcellMargin, 0.6 * Math.min(calculateDistance(this.innerRectangle[0], this.innerRectangle[1]), calculateDistance(this.innerRectangle[1], this.innerRectangle[2]))));
        let orientation = random(0, 3);

        let edge1;
        let edge2;
        let corner1 = new Vertex(0, 0);
        let corner2 = new Vertex(0, 0);
        let mid;

        let part1;
        let part2;
        
        if (orientation == 0) {
            govBuilding.push(new Vertex(this.innerRectangle[0].x, this.innerRectangle[0].y));
            govBuilding.push(new Vertex(this.innerRectangle[1].x, this.innerRectangle[1].y));
            govBuilding.push(new Vertex(this.innerRectangle[1].x + (this.innerRectangle[2].x - this.innerRectangle[1].x) * govWidth / calculateDistance(this.innerRectangle[1], this.innerRectangle[2]), this.innerRectangle[1].y + (this.innerRectangle[2].y - this.innerRectangle[1].y) * govWidth / calculateDistance(this.innerRectangle[1], this.innerRectangle[2])));
            govBuilding.push(new Vertex(this.innerRectangle[0].x + (this.innerRectangle[1].x - this.innerRectangle[0].x) * govWidth / calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) + (this.innerRectangle[3].x - this.innerRectangle[0].x) * govWidth / calculateDistance(this.innerRectangle[0], this.innerRectangle[3]), this.innerRectangle[0].y + (this.innerRectangle[1].y - this.innerRectangle[0].y) * govWidth / calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) + (this.innerRectangle[3].y - this.innerRectangle[0].y) * govWidth / calculateDistance(this.innerRectangle[0], this.innerRectangle[3])));
            govBuilding.push(new Vertex(this.innerRectangle[3].x + (this.innerRectangle[2].x - this.innerRectangle[3].x) * govWidth / calculateDistance(this.innerRectangle[2], this.innerRectangle[3]), this.innerRectangle[3].y + (this.innerRectangle[2].y - this.innerRectangle[3].y) * govWidth / calculateDistance(this.innerRectangle[2], this.innerRectangle[3])));
            govBuilding.push(new Vertex(this.innerRectangle[3].x, this.innerRectangle[3].y));
            
            edge1 = new Vertex((govBuilding[4].x + govBuilding[5].x) / 2, (govBuilding[4].y + govBuilding[5].y) / 2);
            edge2 = new Vertex((govBuilding[1].x + govBuilding[2].x) / 2, (govBuilding[1].y + govBuilding[2].y) / 2);
            mid = new Vertex((govBuilding[0].x + govBuilding[3].x) / 2, (govBuilding[0].y + govBuilding[3].y) / 2);
            corner1.setVertex(govBuilding[0]);
            corner2.setVertex(govBuilding[3]);
            part1 = [govBuilding[0], govBuilding[1], govBuilding[2], govBuilding[3]];
            part2 = [govBuilding[0], govBuilding[3], govBuilding[4], govBuilding[5]];
        }
        else if (orientation == 1) {
            govBuilding.push(new Vertex(this.innerRectangle[0].x, this.innerRectangle[0].y));
            govBuilding.push(new Vertex(this.innerRectangle[1].x, this.innerRectangle[1].y));
            govBuilding.push(new Vertex(this.innerRectangle[2].x, this.innerRectangle[2].y));
            govBuilding.push(new Vertex(this.innerRectangle[2].x + (this.innerRectangle[3].x - this.innerRectangle[2].x) * govWidth / calculateDistance(this.innerRectangle[2], this.innerRectangle[3]), this.innerRectangle[2].y + (this.innerRectangle[3].y - this.innerRectangle[2].y) * govWidth / calculateDistance(this.innerRectangle[2], this.innerRectangle[3])));
            govBuilding.push(new Vertex(this.innerRectangle[1].x + (this.innerRectangle[0].x - this.innerRectangle[1].x) * govWidth / calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) + (this.innerRectangle[2].x - this.innerRectangle[1].x) * govWidth / calculateDistance(this.innerRectangle[1], this.innerRectangle[2]), this.innerRectangle[1].y + (this.innerRectangle[0].y - this.innerRectangle[1].y) * govWidth / calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) + (this.innerRectangle[2].y - this.innerRectangle[1].y) * govWidth / calculateDistance(this.innerRectangle[1], this.innerRectangle[2])));
            govBuilding.push(new Vertex(this.innerRectangle[0].x + (this.innerRectangle[3].x - this.innerRectangle[0].x) * govWidth / calculateDistance(this.innerRectangle[0], this.innerRectangle[3]), this.innerRectangle[0].y + (this.innerRectangle[3].y - this.innerRectangle[0].y) * govWidth / calculateDistance(this.innerRectangle[0], this.innerRectangle[3])));

            edge1 = new Vertex((govBuilding[2].x + govBuilding[3].x) / 2, (govBuilding[2].y + govBuilding[3].y) / 2);
            edge2 = new Vertex((govBuilding[0].x + govBuilding[5].x) / 2, (govBuilding[0].y + govBuilding[5].y) / 2);
            mid = new Vertex((govBuilding[1].x + govBuilding[4].x) / 2, (govBuilding[1].y + govBuilding[4].y) / 2);
            corner1.setVertex(govBuilding[1]);
            corner2.setVertex(govBuilding[4]);
            part1 = [govBuilding[0], govBuilding[1], govBuilding[4], govBuilding[5]];
            part2 = [govBuilding[4], govBuilding[1], govBuilding[2], govBuilding[3]];
        }
        else if (orientation == 2) {
            govBuilding.push(new Vertex(this.innerRectangle[1].x + (this.innerRectangle[0].x - this.innerRectangle[1].x) * govWidth / calculateDistance(this.innerRectangle[0], this.innerRectangle[1]), this.innerRectangle[1].y + (this.innerRectangle[0].y - this.innerRectangle[1].y) * govWidth / calculateDistance(this.innerRectangle[0], this.innerRectangle[1])));
            govBuilding.push(new Vertex(this.innerRectangle[1].x, this.innerRectangle[1].y));
            govBuilding.push(new Vertex(this.innerRectangle[2].x, this.innerRectangle[2].y));
            govBuilding.push(new Vertex(this.innerRectangle[3].x, this.innerRectangle[3].y));
            govBuilding.push(new Vertex(this.innerRectangle[3].x + (this.innerRectangle[0].x - this.innerRectangle[3].x) * govWidth / calculateDistance(this.innerRectangle[0], this.innerRectangle[3]), this.innerRectangle[3].y + (this.innerRectangle[0].y - this.innerRectangle[3].y) * govWidth / calculateDistance(this.innerRectangle[0], this.innerRectangle[3])));
            govBuilding.push(new Vertex(this.innerRectangle[2].x + (this.innerRectangle[1].x - this.innerRectangle[2].x) * govWidth / calculateDistance(this.innerRectangle[1], this.innerRectangle[2]) + (this.innerRectangle[3].x - this.innerRectangle[2].x) * govWidth / calculateDistance(this.innerRectangle[2], this.innerRectangle[3]), this.innerRectangle[2].y + (this.innerRectangle[1].y - this.innerRectangle[2].y) * govWidth / calculateDistance(this.innerRectangle[1], this.innerRectangle[2]) + (this.innerRectangle[3].y - this.innerRectangle[2].y) * govWidth / calculateDistance(this.innerRectangle[2], this.innerRectangle[3])));
            
            edge1 = new Vertex((govBuilding[0].x + govBuilding[1].x) / 2, (govBuilding[0].y + govBuilding[1].y) / 2);
            edge2 = new Vertex((govBuilding[3].x + govBuilding[4].x) / 2, (govBuilding[3].y + govBuilding[4].y) / 2);
            mid = new Vertex((govBuilding[2].x + govBuilding[5].x) / 2, (govBuilding[2].y + govBuilding[5].y) / 2);
            corner1.setVertex(govBuilding[2]);
            corner2.setVertex(govBuilding[5]);
            part1 = [govBuilding[0], govBuilding[1], govBuilding[2], govBuilding[5]];
            part2 = [govBuilding[4], govBuilding[5], govBuilding[2], govBuilding[3]];
        }
        else {
            govBuilding.push(new Vertex(this.innerRectangle[0].x, this.innerRectangle[0].y));
            govBuilding.push(new Vertex(this.innerRectangle[0].x + (this.innerRectangle[1].x - this.innerRectangle[0].x) * govWidth / calculateDistance(this.innerRectangle[0], this.innerRectangle[1]), this.innerRectangle[0].y + (this.innerRectangle[1].y - this.innerRectangle[0].y) * govWidth / calculateDistance(this.innerRectangle[0], this.innerRectangle[1])));
            govBuilding.push(new Vertex(this.innerRectangle[3].x + (this.innerRectangle[0].x - this.innerRectangle[3].x) * govWidth / calculateDistance(this.innerRectangle[0], this.innerRectangle[3]) + (this.innerRectangle[2].x - this.innerRectangle[3].x) * govWidth / calculateDistance(this.innerRectangle[2], this.innerRectangle[3]), this.innerRectangle[3].y + (this.innerRectangle[0].y - this.innerRectangle[3].y) * govWidth / calculateDistance(this.innerRectangle[0], this.innerRectangle[3]) + (this.innerRectangle[2].y - this.innerRectangle[3].y) * govWidth / calculateDistance(this.innerRectangle[2], this.innerRectangle[3])));
            govBuilding.push(new Vertex(this.innerRectangle[2].x + (this.innerRectangle[1].x - this.innerRectangle[2].x) * govWidth / calculateDistance(this.innerRectangle[1], this.innerRectangle[2]), this.innerRectangle[2].y + (this.innerRectangle[1].y - this.innerRectangle[2].y) * govWidth / calculateDistance(this.innerRectangle[1], this.innerRectangle[2])));
            govBuilding.push(new Vertex(this.innerRectangle[2].x, this.innerRectangle[2].y));
            govBuilding.push(new Vertex(this.innerRectangle[3].x, this.innerRectangle[3].y));
            
            edge1 = new Vertex((govBuilding[0].x + govBuilding[1].x) / 2, (govBuilding[0].y + govBuilding[1].y) / 2);
            edge2 = new Vertex((govBuilding[3].x + govBuilding[4].x) / 2, (govBuilding[3].y + govBuilding[4].y) / 2);
            mid = new Vertex((govBuilding[2].x + govBuilding[5].x) / 2, (govBuilding[2].y + govBuilding[5].y) / 2);
            corner1.setVertex(govBuilding[5]);
            corner2.setVertex(govBuilding[2]);
            part1 = [govBuilding[0], govBuilding[1], govBuilding[2], govBuilding[5]];
            part2 = [govBuilding[2], govBuilding[3], govBuilding[4], govBuilding[5]];
        }
        
        let trees = [];
        for (let x = Math.min(this.margin[0].x, this.margin[1].x, this.margin[2].x, this.margin[3].x); x < Math.max(this.margin[0].x, this.margin[1].x, this.margin[2].x, this.margin[3].x); x += 2 * settings.subcellMargin) {
            for (let y = Math.min(this.margin[0].y, this.margin[1].y, this.margin[2].y, this.margin[3].y); y < Math.max(this.margin[0].y, this.margin[1].y, this.margin[2].y, this.margin[3].y); y += 2 * settings.subcellMargin) {
                for (let i = 0; i < 5; i++) {
                    let tree = new Vertex(random(x + 0.2 * settings.subcellMargin, x + 1.8 * settings.subcellMargin), random(y + 0.2 * settings.subcellMargin, y + 1.8 * settings.subcellMargin));
                    if (isPointWithinQuadrilateral(this.margin, tree) && !isPointWithinQuadrilateral(part1, tree) && !isPointWithinQuadrilateral(part2, tree)) {
                        trees.push(new Tree(tree, randomFloat(0.2, 0.5) * settings.subcellMargin));
                        break;
                    }
                }
            }
        }

        ctx.fillStyle = '#95a5a6';
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (const vertex of this.vertices) {
            ctx.lineTo(vertex.x, vertex.y);
        }
        ctx.closePath();
        ctx.fill();

        if (this.neighbourhood == 0) {
            ctx.fillStyle = '#a65a4c';
        }
        else {
            ctx.fillStyle = '#808076';
        }

        ctx.beginPath();
        ctx.moveTo(govBuilding[0].x, govBuilding[0].y);
        for (const vertex of govBuilding) {
            ctx.lineTo(vertex.x, vertex.y);
        }
        ctx.closePath();
        ctx.fill();

        if (this.neighbourhood == 0) {
            ctx.fillStyle = '#85483d';
            if (orientation == 0) {
                ctx.beginPath();
                ctx.moveTo(corner1.x, corner1.y);
                ctx.lineTo(mid.x, mid.y);
                ctx.lineTo(edge1.x, edge1.y);
                ctx.lineTo(govBuilding[5].x, govBuilding[5].y);
                ctx.closePath();
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(mid.x, mid.y);
                ctx.lineTo(edge2.x, edge2.y);
                ctx.lineTo(govBuilding[2].x, govBuilding[2].y);
                ctx.lineTo(corner2.x, corner2.y);
                ctx.closePath();
                ctx.fill();
            }
            else if (orientation == 1) {
                ctx.beginPath();
                ctx.moveTo(edge2.x, edge2.y);
                ctx.lineTo(mid.x, mid.y);
                ctx.lineTo(edge1.x, edge1.y);
                ctx.lineTo(govBuilding[3].x, govBuilding[3].y);
                ctx.lineTo(corner2.x, corner2.y);
                ctx.lineTo(govBuilding[5].x, govBuilding[5].y);
                ctx.closePath();
                ctx.fill();
            }
            else if (orientation == 2) {
                ctx.beginPath();
                ctx.moveTo(govBuilding[0].x, govBuilding[0].y);
                ctx.lineTo(edge1.x, edge1.y);
                ctx.lineTo(mid.x, mid.y);
                ctx.lineTo(edge2.x, edge2.y);
                ctx.lineTo(govBuilding[4].x, govBuilding[4].y);
                ctx.lineTo(corner2.x, corner2.y);
                ctx.closePath();
                ctx.fill();
            }
            else {
                ctx.beginPath();
                ctx.moveTo(govBuilding[0].x, govBuilding[0].y);
                ctx.lineTo(edge1.x, edge1.y);
                ctx.lineTo(mid.x, mid.y);
                ctx.lineTo(edge2.x, edge2.y);
                ctx.lineTo(govBuilding[4].x, govBuilding[4].y);
                ctx.lineTo(corner1.x, corner1.y);
                ctx.closePath();
                ctx.fill();
            }
        }
        
        if (this.neighbourhood == 0) {
            ctx.strokeStyle = '#7e4d44';
        }
        else {
            ctx.strokeStyle = '#66665e';
        }
        
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(govBuilding[0].x, govBuilding[0].y);
        for (const vertex of govBuilding) {
            ctx.lineTo(vertex.x, vertex.y);
        }
        ctx.closePath();
        ctx.stroke();

        if (this.neighbourhood == 0) {
            ctx.beginPath();
            ctx.moveTo(edge1.x, edge1.y);
            ctx.lineTo(mid.x, mid.y);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(edge2.x, edge2.y);
            ctx.lineTo(mid.x, mid.y);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(corner1.x, corner1.y);
            ctx.lineTo(mid.x, mid.y);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(corner2.x, corner2.y);
            ctx.lineTo(mid.x, mid.y);
            ctx.stroke();
        }

        for (let tree of trees) {
            tree.draw();
        }
    }
}

class Cell {
    constructor(vertices) {
        this.vertices = [];
        for (const vertex of vertices) {
            this.vertices.push(new Vertex(vertex.x, vertex.y));
        }

        this.type = this.generateType();
    }

    setVertex(pos, vertex) {
        this.vertices[pos].setVertex(vertex);
    }

    generateType() {
        let center = new Vertex(width / 2, height / 2);
        let cellDist = calculateDistance(findIntersection(this.vertices[0], this.vertices[2], this.vertices[1], this.vertices[3]), center);
        let maxDist = calculateDistance(new Vertex(0, 0), center);

        this.neighbourhood = cellDist / maxDist < settings.outerInnerProp + randomFloat(-0.1, 0.1) ? 0 : 1;

        let lake = cellDist / maxDist * settings.chanceOfLake;
        let palace = cellDist / maxDist * settings.chanceOfPalace;
        let forest = cellDist / maxDist * settings.chanceOfForest;

        let type = randomFloat(0, 1);

        if (type < lake) {
            return 3;
        }
        else if (type < lake + palace) {
            return 2;
        }
        else if (type < lake + palace + forest) {
            return 1;
        }
        else {
            return 0;
        }
    }

    draw() {
        if (this.type == 3) {
            this.drawLake();
        }
        if (this.type == 2) {
            this.drawPalace();
        }
        if (this.type == 1) {
            this.drawForest();
        }
        if (this.type == 0) {
            this.drawGrid();
        }
        
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 2 * settings.roadWidth;
        ctx.beginPath();
        ctx.moveTo((this.vertices[0].x + this.vertices[1].x) / 2, (this.vertices[0].y + this.vertices[1].y) / 2);
        for (let i = 1; i < 4; i++) {
            ctx.arcTo(this.vertices[i].x, this.vertices[i].y, this.vertices[i == 3 ? 0 : i + 1].x, this.vertices[i == 3 ? 0 : i + 1].y, 1);
        }
        ctx.arcTo(this.vertices[0].x, this.vertices[0].y, (this.vertices[0].x + this.vertices[1].x) / 2, (this.vertices[0].y + this.vertices[1].y) / 2, 1);
        ctx.closePath();
        ctx.stroke();
    }

    drawLake() {
        this.calculateMargin(4 * settings.subcellMargin);

        if (this.type == 0) {
            this.type = 1;
            return;
        }

        this.calculateMargin(3 * settings.subcellMargin);

        let lake = [];
        for (let i = 0; i < 4; i++) {
            lake.push(new Vertex(this.margin[i].x, this.margin[i].y));
            
            let offsetX = (this.margin[i == 3 ? 0 : i + 1].y - this.margin[i].y) * settings.subcellMargin / calculateDistance(this.margin[i], this.margin[i == 3 ? 0 : i + 1]);
            let offsetY = (this.margin[i == 3 ? 0 : i + 1].x - this.margin[i].x) * settings.subcellMargin / calculateDistance(this.margin[i], this.margin[i == 3 ? 0 : i + 1]);

            if (random(0, 1) == 0) {
                lake.push(new Vertex((this.margin[i].x + this.margin[i == 3 ? 0 : i + 1].x) / 2 + offsetX, (this.margin[i].y + this.margin[i == 3 ? 0 : i + 1].y) / 2 + offsetY));
            }
            else {
                lake.push(new Vertex((this.margin[i].x + this.margin[i == 3 ? 0 : i + 1].x) / 2 - offsetX, (this.margin[i].y + this.margin[i == 3 ? 0 : i + 1].y) / 2 - offsetY));
            }
        }

        this.calculateMargin(2 * settings.subcellMargin);

        let innerMargin = [];
        for (const vertex of this.margin) {
            innerMargin.push(new Vertex(vertex.x, vertex.y));
        }

        this.calculateMargin(settings.subcellMargin);

        let trees = [];
        for (let x = Math.min(this.margin[0].x, this.margin[1].x, this.margin[2].x, this.margin[3].x); x < Math.max(this.margin[0].x, this.margin[1].x, this.margin[2].x, this.margin[3].x); x += 2 * settings.subcellMargin) {
            for (let y = Math.min(this.margin[0].y, this.margin[1].y, this.margin[2].y, this.margin[3].y); y < Math.max(this.margin[0].y, this.margin[1].y, this.margin[2].y, this.margin[3].y); y += 2 * settings.subcellMargin) {
                for (let i = 0; i < 5; i++) {
                    let tree = new Vertex(random(x + 0.2 * settings.subcellMargin, x + 1.8 * settings.subcellMargin), random(y + 0.2 * settings.subcellMargin, y + 1.8 * settings.subcellMargin));
                    if (isPointWithinQuadrilateral(this.margin, tree) && !isPointWithinQuadrilateral(innerMargin, tree)) {
                        trees.push(new Tree(tree, randomFloat(0.2, 0.5) * settings.subcellMargin));
                        break;
                    }
                }
            }
        }

        ctx.fillStyle = '#7ec850';
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (const vertex of this.vertices) {
            ctx.lineTo(vertex.x, vertex.y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.moveTo((lake[0].x + lake[1].x) / 2, (lake[0].y + lake[1].y) / 2);
        for (let i = 1; i < lake.length - 1; i++) {
            let p = (calculateDistance(lake[i - 1], lake[i]) + calculateDistance(lake[i], lake[i + 1]) + calculateDistance(lake[i - 1], lake[i + 1])) / 2;
            ctx.arcTo(lake[i].x, lake[i].y, lake[i + 1].x, lake[i + 1].y, Math.sqrt((p - calculateDistance(lake[i - 1], lake[i])) * (p - calculateDistance(lake[i], lake[i + 1])) * (p - calculateDistance(lake[i - 1], lake[i + 1])) / p));
        }
        let p = (calculateDistance(lake[lake.length - 2], lake[lake.length - 1]) + calculateDistance(lake[lake.length - 1], lake[0]) + calculateDistance(lake[lake.length - 2], lake[0])) / 2;
        ctx.arcTo(lake[lake.length - 1].x, lake[lake.length - 1].y, lake[0].x, lake[0].y, Math.sqrt((p - calculateDistance(lake[lake.length - 2], lake[lake.length - 1])) * (p - calculateDistance(lake[lake.length - 1], lake[0])) * (p - calculateDistance(lake[lake.length - 2], lake[0])) / p));
        let v = new Vertex((lake[0].x + lake[1].x) / 2, (lake[0].y + lake[1].y) / 2);
        p = (calculateDistance(lake[lake.length - 1], lake[0]) + calculateDistance(lake[0], v) + calculateDistance(lake[lake.length - 1], v)) / 2;
        ctx.arcTo(lake[0].x, lake[0].y, v.x, v.y, Math.sqrt((p - calculateDistance(lake[lake.length - 1], lake[0])) * (p - calculateDistance(lake[0], v)) * (p - calculateDistance(lake[lake.length - 1], v)) / p));
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo((lake[0].x + lake[1].x) / 2, (lake[0].y + lake[1].y) / 2);
        for (let i = 1; i < lake.length - 1; i++) {
            let p = (calculateDistance(lake[i - 1], lake[i]) + calculateDistance(lake[i], lake[i + 1]) + calculateDistance(lake[i - 1], lake[i + 1])) / 2;
            ctx.arcTo(lake[i].x, lake[i].y, lake[i + 1].x, lake[i + 1].y, Math.sqrt((p - calculateDistance(lake[i - 1], lake[i])) * (p - calculateDistance(lake[i], lake[i + 1])) * (p - calculateDistance(lake[i - 1], lake[i + 1])) / p));
        }
        p = (calculateDistance(lake[lake.length - 2], lake[lake.length - 1]) + calculateDistance(lake[lake.length - 1], lake[0]) + calculateDistance(lake[lake.length - 2], lake[0])) / 2;
        ctx.arcTo(lake[lake.length - 1].x, lake[lake.length - 1].y, lake[0].x, lake[0].y, Math.sqrt((p - calculateDistance(lake[lake.length - 2], lake[lake.length - 1])) * (p - calculateDistance(lake[lake.length - 1], lake[0])) * (p - calculateDistance(lake[lake.length - 2], lake[0])) / p));
        v = new Vertex((lake[0].x + lake[1].x) / 2, (lake[0].y + lake[1].y) / 2);
        p = (calculateDistance(lake[lake.length - 1], lake[0]) + calculateDistance(lake[0], v) + calculateDistance(lake[lake.length - 1], v)) / 2;
        ctx.arcTo(lake[0].x, lake[0].y, v.x, v.y, Math.sqrt((p - calculateDistance(lake[lake.length - 1], lake[0])) * (p - calculateDistance(lake[0], v)) * (p - calculateDistance(lake[lake.length - 1], v)) / p));
        ctx.closePath();
        ctx.stroke();

        for (const tree of trees) {
            tree.draw();
        }
    }

    drawPalace() {
        this.calculateMargin(settings.subcellMargin);

        if (this.type == 0) {
            return;
        }

        this.getInnerRectangle();
        
        if (this.innerRectangle == null) {
            this.type = 1;
            return;
        }
        
        if (calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) < 7 * settings.subcellMargin || calculateDistance(this.innerRectangle[1], this.innerRectangle[2]) < 7 * settings.subcellMargin) {
            this.type = 1;
            return;
        }

        this.shortenInnerRectangle(random(7 * settings.subcellMargin, 9 * settings.subcellMargin), random(7 * settings.subcellMargin, 9 * settings.subcellMargin));

        let area = [];
        area.push(new Vertex(this.innerRectangle[0].x, this.innerRectangle[0].y));
        area.push(new Vertex(this.innerRectangle[1].x, this.innerRectangle[1].y));
        area.push(new Vertex(this.innerRectangle[2].x, this.innerRectangle[2].y));
        area.push(new Vertex(this.innerRectangle[3].x, this.innerRectangle[3].y));

        this.shortenInnerRectangle(calculateDistance(this.innerRectangle[1], this.innerRectangle[2]) - settings.subcellMargin, calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) - settings.subcellMargin);

        let palace = [];
        let palaceLength = randomFloat(0.3, 0.5);
        let palaceWidth;
        let orientation;
        let parameters;
        let lawns = [];
        let pathSource = new Vertex(0, 0);
        let pathDest = new Vertex(0, 0);

        if (calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) < calculateDistance(this.innerRectangle[1], this.innerRectangle[2])) {
            orientation = random(0, 1);
            palaceWidth = random(Math.min(1.5 * settings.subcellMargin, calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) / 3, 0.6 * palaceLength *  calculateDistance(this.innerRectangle[1], this.innerRectangle[2])), Math.min(3 * settings.subcellMargin, calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) / 3, 0.6 * palaceLength *  calculateDistance(this.innerRectangle[1], this.innerRectangle[2])));
        }
        else {
            orientation = random(2, 3);
            palaceWidth = random(Math.min(1.5 * settings.subcellMargin, calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) / 3, palaceLength *  calculateDistance(this.innerRectangle[1], this.innerRectangle[2]) / 2), Math.min(3 * settings.subcellMargin, calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) / 3, palaceLength *  calculateDistance(this.innerRectangle[1], this.innerRectangle[2]) / 2));
        }

        if (orientation == 0) {
            palace.push(new Vertex(this.innerRectangle[0].x, this.innerRectangle[0].y));
            palace.push(new Vertex(this.innerRectangle[1].x, this.innerRectangle[1].y));
            palace.push(new Vertex(this.innerRectangle[1].x + palaceLength * (this.innerRectangle[2].x - this.innerRectangle[1].x), this.innerRectangle[1].y + palaceLength * (this.innerRectangle[2].y - this.innerRectangle[1].y)));
            palace.push(new Vertex(palace[2].x + palaceWidth * (this.innerRectangle[0].x - this.innerRectangle[1].x) / calculateDistance(this.innerRectangle[0], this.innerRectangle[1]), palace[2].y + palaceWidth * (this.innerRectangle[0].y - this.innerRectangle[1].y) / calculateDistance(this.innerRectangle[0], this.innerRectangle[1])));
            palace.push(new Vertex(this.innerRectangle[1].x + palaceWidth * (this.innerRectangle[0].x - this.innerRectangle[1].x) / calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) + palaceWidth * (this.innerRectangle[2].x - this.innerRectangle[1].x) / calculateDistance(this.innerRectangle[1], this.innerRectangle[2]), this.innerRectangle[1].y + palaceWidth * (this.innerRectangle[0].y - this.innerRectangle[1].y) / calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) + palaceWidth * (this.innerRectangle[2].y - this.innerRectangle[1].y) / calculateDistance(this.innerRectangle[1], this.innerRectangle[2])));
            palace.push(new Vertex(this.innerRectangle[0].x + palaceWidth * (this.innerRectangle[1].x - this.innerRectangle[0].x) / calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) + palaceWidth * (this.innerRectangle[3].x - this.innerRectangle[0].x) / calculateDistance(this.innerRectangle[0], this.innerRectangle[3]), this.innerRectangle[0].y + palaceWidth * (this.innerRectangle[1].y - this.innerRectangle[0].y) / calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) + palaceWidth * (this.innerRectangle[3].y - this.innerRectangle[0].y) / calculateDistance(this.innerRectangle[0], this.innerRectangle[3])));
            palace.push(new Vertex(this.innerRectangle[0].x + palaceWidth * (this.innerRectangle[1].x - this.innerRectangle[0].x) / calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) + palaceLength * (this.innerRectangle[3].x - this.innerRectangle[0].x), this.innerRectangle[0].y + palaceWidth * (this.innerRectangle[1].y - this.innerRectangle[0].y) / calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) + palaceLength * (this.innerRectangle[3].y - this.innerRectangle[0].y)));
            palace.push(new Vertex(this.innerRectangle[0].x + palaceLength * (this.innerRectangle[3].x - this.innerRectangle[0].x), this.innerRectangle[0].y + palaceLength * (this.innerRectangle[3].y - this.innerRectangle[0].y)));
            
            parameters = [1, 4, 0, 5, 2, 3, 1, 4, 0, 5, 6, 7];

            lawns.push([]);
            lawns[0].push(new Vertex(palace[7].x + .05 * (palace[2].x - palace[7].x) + .15 * (this.innerRectangle[3].x - palace[7].x), palace[7].y + .05 * (palace[2].y - palace[7].y) + .15 * (this.innerRectangle[3].y - palace[7].y)));
            lawns[0].push(new Vertex(palace[7].x + .4 * (palace[2].x - palace[7].x) + .15 * (this.innerRectangle[3].x - palace[7].x), palace[7].y + .4 * (palace[2].y - palace[7].y) + .15 * (this.innerRectangle[3].y - palace[7].y)));
            lawns[0].push(new Vertex(this.innerRectangle[3].x + .4 * (this.innerRectangle[2].x - this.innerRectangle[3].x) + .05 * (this.innerRectangle[0].x - this.innerRectangle[3].x), this.innerRectangle[3].y + .4 * (this.innerRectangle[2].y - this.innerRectangle[3].y) + .05 * (this.innerRectangle[0].y - this.innerRectangle[3].y)));
            lawns[0].push(new Vertex(this.innerRectangle[3].x + .05 * (this.innerRectangle[2].x - this.innerRectangle[3].x) + .05 * (this.innerRectangle[0].x - this.innerRectangle[3].x), this.innerRectangle[3].y + .05 * (this.innerRectangle[2].y - this.innerRectangle[3].y) + .05 * (this.innerRectangle[0].y - this.innerRectangle[3].y)));

            lawns.push([]);
            lawns[1].push(new Vertex(palace[2].x + .4 * (palace[7].x - palace[2].x) + .15 * (this.innerRectangle[2].x - palace[2].x), palace[2].y + .4 * (palace[7].y - palace[2].y) + .15 * (this.innerRectangle[2].y - palace[2].y)));
            lawns[1].push(new Vertex(palace[2].x + .05 * (palace[7].x - palace[2].x) + .15 * (this.innerRectangle[2].x - palace[2].x), palace[2].y + .05 * (palace[7].y - palace[2].y) + .15 * (this.innerRectangle[2].y - palace[2].y)));
            lawns[1].push(new Vertex(this.innerRectangle[2].x + .05 * (this.innerRectangle[3].x - this.innerRectangle[2].x) + .05 * (this.innerRectangle[1].x - this.innerRectangle[2].x), this.innerRectangle[2].y + .05 * (this.innerRectangle[3].y - this.innerRectangle[2].y) + .05 * (this.innerRectangle[1].y - this.innerRectangle[2].y)));
            lawns[1].push(new Vertex(this.innerRectangle[2].x + .4 * (this.innerRectangle[3].x - this.innerRectangle[2].x) + .05 * (this.innerRectangle[1].x - this.innerRectangle[2].x), this.innerRectangle[2].y + .4 * (this.innerRectangle[3].y - this.innerRectangle[2].y) + .05 * (this.innerRectangle[1].y - this.innerRectangle[2].y)));
            
            pathSource = new Vertex((this.innerRectangle[2].x + this.innerRectangle[3].x) / 2, (this.innerRectangle[2].y + this.innerRectangle[3].y) / 2);
            pathDest = findIntersection(this.vertices[2], this.vertices[3], pathSource, new Vertex((this.innerRectangle[0].x + this.innerRectangle[1].x) / 2, (this.innerRectangle[0].y + this.innerRectangle[1].y) / 2));
        }
        else if (orientation == 1) {
            palace.push(new Vertex(this.innerRectangle[3].x + palaceLength * (this.innerRectangle[0].x - this.innerRectangle[3].x), this.innerRectangle[3].y + palaceLength * (this.innerRectangle[0].y - this.innerRectangle[3].y)));
            palace.push(new Vertex(this.innerRectangle[3].x + palaceWidth * (this.innerRectangle[2].x - this.innerRectangle[3].x) / calculateDistance(this.innerRectangle[2], this.innerRectangle[3]) + palaceLength * (this.innerRectangle[0].x - this.innerRectangle[3].x), this.innerRectangle[3].y + palaceWidth * (this.innerRectangle[2].y - this.innerRectangle[3].y) / calculateDistance(this.innerRectangle[2], this.innerRectangle[3]) + palaceLength * (this.innerRectangle[0].y - this.innerRectangle[3].y)));
            palace.push(new Vertex(this.innerRectangle[3].x + palaceWidth * (this.innerRectangle[2].x - this.innerRectangle[3].x) / calculateDistance(this.innerRectangle[2], this.innerRectangle[3]) + palaceWidth * (this.innerRectangle[0].x - this.innerRectangle[3].x) / calculateDistance(this.innerRectangle[0], this.innerRectangle[3]), this.innerRectangle[3].y + palaceWidth * (this.innerRectangle[2].y - this.innerRectangle[3].y) / calculateDistance(this.innerRectangle[2], this.innerRectangle[3]) + palaceWidth * (this.innerRectangle[0].y - this.innerRectangle[3].y) / calculateDistance(this.innerRectangle[0], this.innerRectangle[3])));
            palace.push(new Vertex(this.innerRectangle[2].x + palaceWidth * (this.innerRectangle[3].x - this.innerRectangle[2].x) / calculateDistance(this.innerRectangle[2], this.innerRectangle[3]) + palaceWidth * (this.innerRectangle[1].x - this.innerRectangle[2].x) / calculateDistance(this.innerRectangle[1], this.innerRectangle[2]), this.innerRectangle[2].y + palaceWidth * (this.innerRectangle[3].y - this.innerRectangle[2].y) / calculateDistance(this.innerRectangle[2], this.innerRectangle[3]) + palaceWidth * (this.innerRectangle[1].y - this.innerRectangle[2].y) / calculateDistance(this.innerRectangle[1], this.innerRectangle[2])));
            palace.push(new Vertex(this.innerRectangle[2].x + palaceWidth * (this.innerRectangle[3].x - this.innerRectangle[2].x) / calculateDistance(this.innerRectangle[2], this.innerRectangle[3]) + palaceLength * (this.innerRectangle[1].x - this.innerRectangle[2].x), this.innerRectangle[2].y + palaceWidth * (this.innerRectangle[3].y - this.innerRectangle[2].y) / calculateDistance(this.innerRectangle[2], this.innerRectangle[3]) + palaceLength * (this.innerRectangle[1].y - this.innerRectangle[2].y)));
            palace.push(new Vertex(this.innerRectangle[2].x + palaceLength * (this.innerRectangle[1].x - this.innerRectangle[2].x), this.innerRectangle[2].y + palaceLength * (this.innerRectangle[1].y - this.innerRectangle[2].y)));
            palace.push(new Vertex(this.innerRectangle[2].x, this.innerRectangle[2].y));
            palace.push(new Vertex(this.innerRectangle[3].x, this.innerRectangle[3].y));

            parameters = [2, 7, 3, 6, 0, 1, 2, 7, 6, 3, 4, 5];

            lawns.push([]);
            lawns[0].push(new Vertex(this.innerRectangle[0].x + .05 * (this.innerRectangle[1].x - this.innerRectangle[0].x) + .05 * (this.innerRectangle[3].x - this.innerRectangle[0].x), this.innerRectangle[0].y + .05 * (this.innerRectangle[1].y - this.innerRectangle[0].y) + .05 * (this.innerRectangle[3].y - this.innerRectangle[0].y)));
            lawns[0].push(new Vertex(this.innerRectangle[0].x + .4 * (this.innerRectangle[1].x - this.innerRectangle[0].x) + .05 * (this.innerRectangle[3].x - this.innerRectangle[0].x), this.innerRectangle[0].y + .4 * (this.innerRectangle[1].y - this.innerRectangle[0].y) + .05 * (this.innerRectangle[3].y - this.innerRectangle[0].y)));
            lawns[0].push(new Vertex(palace[0].x + .4 * (palace[5].x - palace[0].x) + .15 * (this.innerRectangle[0].x - palace[0].x), palace[0].y + .4 * (palace[5].y - palace[0].y) + .15 * (this.innerRectangle[0].y - palace[0].y)));
            lawns[0].push(new Vertex(palace[0].x + .05 * (palace[5].x - palace[0].x) + .15 * (this.innerRectangle[0].x - palace[0].x), palace[0].y + .05 * (palace[5].y - palace[0].y) + .15 * (this.innerRectangle[0].y - palace[0].y)));

            lawns.push([]);
            lawns[1].push(new Vertex(this.innerRectangle[1].x + .4 * (this.innerRectangle[0].x - this.innerRectangle[1].x) + .05 * (this.innerRectangle[2].x - this.innerRectangle[1].x), this.innerRectangle[1].y + .4 * (this.innerRectangle[0].y - this.innerRectangle[1].y) + .05 * (this.innerRectangle[2].y - this.innerRectangle[1].y)));
            lawns[1].push(new Vertex(this.innerRectangle[1].x + .05 * (this.innerRectangle[0].x - this.innerRectangle[1].x) + .05 * (this.innerRectangle[2].x - this.innerRectangle[1].x), this.innerRectangle[1].y + .05 * (this.innerRectangle[0].y - this.innerRectangle[1].y) + .05 * (this.innerRectangle[2].y - this.innerRectangle[1].y)));
            lawns[1].push(new Vertex(palace[5].x + .05 * (palace[0].x - palace[5].x) + .15 * (this.innerRectangle[1].x - palace[5].x), palace[5].y + .05 * (palace[0].y - palace[5].y) + .15 * (this.innerRectangle[1].y - palace[5].y)));
            lawns[1].push(new Vertex(palace[5].x + .4 * (palace[0].x - palace[5].x) + .15 * (this.innerRectangle[1].x - palace[5].x), palace[5].y + .4 * (palace[0].y - palace[5].y) + .15 * (this.innerRectangle[1].y - palace[5].y)));
            
            pathSource = new Vertex((this.innerRectangle[0].x + this.innerRectangle[1].x) / 2, (this.innerRectangle[0].y + this.innerRectangle[1].y) / 2);
            pathDest = findIntersection(this.vertices[0], this.vertices[1], pathSource, new Vertex((this.innerRectangle[2].x + this.innerRectangle[3].x) / 2, (this.innerRectangle[2].y + this.innerRectangle[3].y) / 2));
        }
        else if (orientation == 2) {
            palace.push(new Vertex(this.innerRectangle[0].x, this.innerRectangle[0].y));
            palace.push(new Vertex(this.innerRectangle[0].x + palaceLength * (this.innerRectangle[1].x - this.innerRectangle[0].x), this.innerRectangle[0].y + palaceLength * (this.innerRectangle[1].y - this.innerRectangle[0].y)));
            palace.push(new Vertex(this.innerRectangle[0].x + palaceWidth * (this.innerRectangle[3].x - this.innerRectangle[0].x) / calculateDistance(this.innerRectangle[0], this.innerRectangle[3]) + palaceLength * (this.innerRectangle[1].x - this.innerRectangle[0].x), this.innerRectangle[0].y + palaceWidth * (this.innerRectangle[3].y - this.innerRectangle[0].y) / calculateDistance(this.innerRectangle[0], this.innerRectangle[3]) + palaceLength * (this.innerRectangle[1].y - this.innerRectangle[0].y)));
            palace.push(new Vertex(this.innerRectangle[0].x + palaceWidth * (this.innerRectangle[1].x - this.innerRectangle[0].x) / calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) + palaceWidth * (this.innerRectangle[3].x - this.innerRectangle[0].x) / calculateDistance(this.innerRectangle[0], this.innerRectangle[3]), this.innerRectangle[0].y + palaceWidth * (this.innerRectangle[1].y - this.innerRectangle[0].y) / calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) + palaceWidth * (this.innerRectangle[3].y - this.innerRectangle[0].y) / calculateDistance(this.innerRectangle[0], this.innerRectangle[3])));
            palace.push(new Vertex(this.innerRectangle[3].x + palaceWidth * (this.innerRectangle[0].x - this.innerRectangle[3].x) / calculateDistance(this.innerRectangle[0], this.innerRectangle[3]) + palaceWidth * (this.innerRectangle[2].x - this.innerRectangle[3].x) / calculateDistance(this.innerRectangle[2], this.innerRectangle[3]), this.innerRectangle[3].y + palaceWidth * (this.innerRectangle[0].y - this.innerRectangle[3].y) / calculateDistance(this.innerRectangle[0], this.innerRectangle[3]) + palaceWidth * (this.innerRectangle[2].y - this.innerRectangle[3].y) / calculateDistance(this.innerRectangle[2], this.innerRectangle[3])));
            palace.push(new Vertex(this.innerRectangle[3].x + palaceWidth * (this.innerRectangle[0].x - this.innerRectangle[3].x) / calculateDistance(this.innerRectangle[0], this.innerRectangle[3]) + palaceLength * (this.innerRectangle[2].x - this.innerRectangle[3].x), this.innerRectangle[3].y + palaceWidth * (this.innerRectangle[0].y - this.innerRectangle[3].y) / calculateDistance(this.innerRectangle[0], this.innerRectangle[3]) + palaceLength * (this.innerRectangle[2].y - this.innerRectangle[3].y)));
            palace.push(new Vertex(this.innerRectangle[3].x + palaceLength * (this.innerRectangle[2].x - this.innerRectangle[3].x), this.innerRectangle[3].y + palaceLength * (this.innerRectangle[2].y - this.innerRectangle[3].y)));
            palace.push(new Vertex(this.innerRectangle[3].x, this.innerRectangle[3].y));

            parameters = [0, 3, 7, 4, 1, 2, 0, 3, 7, 4, 5, 6];

            lawns.push([]);
            lawns[0].push(new Vertex(palace[1].x + .05 * (palace[6].x - palace[1].x) + .15 * (this.innerRectangle[1].x - palace[1].x), palace[1].y + .05 * (palace[6].y - palace[1].y) + .15 * (this.innerRectangle[1].y - palace[1].y)));
            lawns[0].push(new Vertex(this.innerRectangle[1].x + .05 * (this.innerRectangle[2].x - this.innerRectangle[1].x) + .05 * (this.innerRectangle[0].x - this.innerRectangle[1].x), this.innerRectangle[1].y + .05 * (this.innerRectangle[2].y - this.innerRectangle[1].y) + .05 * (this.innerRectangle[0].y - this.innerRectangle[1].y)));
            lawns[0].push(new Vertex(this.innerRectangle[1].x + .4 * (this.innerRectangle[2].x - this.innerRectangle[1].x) + .05 * (this.innerRectangle[0].x - this.innerRectangle[1].x), this.innerRectangle[1].y + .4 * (this.innerRectangle[2].y - this.innerRectangle[1].y) + .05 * (this.innerRectangle[0].y - this.innerRectangle[1].y)));
            lawns[0].push(new Vertex(palace[1].x + .4 * (palace[6].x - palace[1].x) + .15 * (this.innerRectangle[1].x - palace[1].x), palace[1].y + .4 * (palace[6].y - palace[1].y) + .15 * (this.innerRectangle[1].y - palace[1].y)));

            lawns.push([]);
            lawns[1].push(new Vertex(palace[6].x + .4 * (palace[1].x - palace[6].x) + .15 * (this.innerRectangle[2].x - palace[6].x), palace[6].y + .4 * (palace[1].y - palace[6].y) + .15 * (this.innerRectangle[2].y - palace[6].y)));
            lawns[1].push(new Vertex(this.innerRectangle[2].x + .4 * (this.innerRectangle[1].x - this.innerRectangle[2].x) + .05 * (this.innerRectangle[3].x - this.innerRectangle[2].x), this.innerRectangle[2].y + .4 * (this.innerRectangle[1].y - this.innerRectangle[2].y) + .05 * (this.innerRectangle[3].y - this.innerRectangle[2].y)));
            lawns[1].push(new Vertex(this.innerRectangle[2].x + .05 * (this.innerRectangle[1].x - this.innerRectangle[2].x) + .05 * (this.innerRectangle[3].x - this.innerRectangle[2].x), this.innerRectangle[2].y + .05 * (this.innerRectangle[1].y - this.innerRectangle[2].y) + .05 * (this.innerRectangle[3].y - this.innerRectangle[2].y)));
            lawns[1].push(new Vertex(palace[6].x + .05 * (palace[1].x - palace[6].x) + .15 * (this.innerRectangle[2].x - palace[6].x), palace[6].y + .05 * (palace[1].y - palace[6].y) + .15 * (this.innerRectangle[2].y - palace[6].y)));
            
            pathSource = new Vertex((this.innerRectangle[1].x + this.innerRectangle[2].x) / 2, (this.innerRectangle[1].y + this.innerRectangle[2].y) / 2);
            pathDest = findIntersection(this.vertices[1], this.vertices[2], pathSource, new Vertex((this.innerRectangle[0].x + this.innerRectangle[3].x) / 2, (this.innerRectangle[0].y + this.innerRectangle[3].y) / 2));
        }
        else {
            palace.push(new Vertex(this.innerRectangle[1].x + palaceLength * (this.innerRectangle[0].x - this.innerRectangle[1].x), this.innerRectangle[1].y + palaceLength * (this.innerRectangle[0].y - this.innerRectangle[1].y)));
            palace.push(new Vertex(this.innerRectangle[1].x, this.innerRectangle[1].y));
            palace.push(new Vertex(this.innerRectangle[2].x, this.innerRectangle[2].y));
            palace.push(new Vertex(this.innerRectangle[2].x + palaceLength * (this.innerRectangle[3].x - this.innerRectangle[2].x), this.innerRectangle[2].y + palaceLength * (this.innerRectangle[3].y - this.innerRectangle[2].y)));
            palace.push(new Vertex(this.innerRectangle[2].x + palaceWidth * (this.innerRectangle[1].x - this.innerRectangle[2].x) / calculateDistance(this.innerRectangle[1], this.innerRectangle[2]) + palaceLength * (this.innerRectangle[3].x - this.innerRectangle[2].x), this.innerRectangle[2].y + palaceWidth * (this.innerRectangle[1].y - this.innerRectangle[2].y) / calculateDistance(this.innerRectangle[1], this.innerRectangle[2]) + palaceLength * (this.innerRectangle[3].y - this.innerRectangle[2].y)));
            palace.push(new Vertex(this.innerRectangle[2].x + palaceWidth * (this.innerRectangle[1].x - this.innerRectangle[2].x) / calculateDistance(this.innerRectangle[1], this.innerRectangle[2]) + palaceWidth * (this.innerRectangle[3].x - this.innerRectangle[2].x) / calculateDistance(this.innerRectangle[2], this.innerRectangle[3]), this.innerRectangle[2].y + palaceWidth * (this.innerRectangle[1].y - this.innerRectangle[2].y) / calculateDistance(this.innerRectangle[1], this.innerRectangle[2]) + palaceWidth * (this.innerRectangle[3].y - this.innerRectangle[2].y) / calculateDistance(this.innerRectangle[2], this.innerRectangle[3])));
            palace.push(new Vertex(this.innerRectangle[1].x + palaceWidth * (this.innerRectangle[2].x - this.innerRectangle[1].x) / calculateDistance(this.innerRectangle[1], this.innerRectangle[2]) + palaceWidth * (this.innerRectangle[0].x - this.innerRectangle[1].x) / calculateDistance(this.innerRectangle[0], this.innerRectangle[1]), this.innerRectangle[1].y + palaceWidth * (this.innerRectangle[2].y - this.innerRectangle[1].y) / calculateDistance(this.innerRectangle[1], this.innerRectangle[2]) + palaceWidth * (this.innerRectangle[0].y - this.innerRectangle[1].y) / calculateDistance(this.innerRectangle[0], this.innerRectangle[1])));
            palace.push(new Vertex(this.innerRectangle[1].x + palaceWidth * (this.innerRectangle[2].x - this.innerRectangle[1].x) / calculateDistance(this.innerRectangle[1], this.innerRectangle[2]) + palaceLength * (this.innerRectangle[0].x - this.innerRectangle[1].x), this.innerRectangle[1].y + palaceWidth * (this.innerRectangle[2].y - this.innerRectangle[1].y) / calculateDistance(this.innerRectangle[1], this.innerRectangle[2]) + palaceLength * (this.innerRectangle[0].y - this.innerRectangle[1].y)));
            
            parameters = [2, 5, 1, 6, 3, 4, 2, 5, 1, 6, 7, 0];

            lawns.push([]);
            lawns[0].push(new Vertex(this.innerRectangle[0].x + .05 * (this.innerRectangle[3].x - this.innerRectangle[0].x) + .05 * (this.innerRectangle[1].x - this.innerRectangle[0].x), this.innerRectangle[0].y + .05 * (this.innerRectangle[3].y - this.innerRectangle[0].y) + .05 * (this.innerRectangle[1].y - this.innerRectangle[0].y)));
            lawns[0].push(new Vertex(palace[0].x + .05 * (palace[3].x - palace[0].x) + .15 * (this.innerRectangle[0].x - palace[0].x), palace[0].y + .05 * (palace[3].y - palace[0].y) + .15 * (this.innerRectangle[0].y - palace[0].y)));
            lawns[0].push(new Vertex(palace[0].x + .4 * (palace[3].x - palace[0].x) + .15 * (this.innerRectangle[0].x - palace[0].x), palace[0].y + .4 * (palace[3].y - palace[0].y) + .15 * (this.innerRectangle[0].y - palace[0].y)));
            lawns[0].push(new Vertex(this.innerRectangle[0].x + .4 * (this.innerRectangle[3].x - this.innerRectangle[0].x) + .05 * (this.innerRectangle[1].x - this.innerRectangle[0].x), this.innerRectangle[0].y + .4 * (this.innerRectangle[3].y - this.innerRectangle[0].y) + .05 * (this.innerRectangle[1].y - this.innerRectangle[0].y)));

            lawns.push([]);
            lawns[1].push(new Vertex(this.innerRectangle[3].x + .4 * (this.innerRectangle[0].x - this.innerRectangle[3].x) + .05 * (this.innerRectangle[2].x - this.innerRectangle[3].x), this.innerRectangle[3].y + .4 * (this.innerRectangle[0].y - this.innerRectangle[3].y) + .05 * (this.innerRectangle[2].y - this.innerRectangle[3].y)));
            lawns[1].push(new Vertex(palace[3].x + .4 * (palace[0].x - palace[3].x) + .15 * (this.innerRectangle[3].x - palace[3].x), palace[3].y + .4 * (palace[0].y - palace[3].y) + .15 * (this.innerRectangle[3].y - palace[3].y)));
            lawns[1].push(new Vertex(palace[3].x + .05 * (palace[0].x - palace[3].x) + .15 * (this.innerRectangle[3].x - palace[3].x), palace[3].y + .05 * (palace[0].y - palace[3].y) + .15 * (this.innerRectangle[3].y - palace[3].y)));
            lawns[1].push(new Vertex(this.innerRectangle[3].x + .05 * (this.innerRectangle[0].x - this.innerRectangle[3].x) + .05 * (this.innerRectangle[2].x - this.innerRectangle[3].x), this.innerRectangle[3].y + .05 * (this.innerRectangle[0].y - this.innerRectangle[3].y) + .05 * (this.innerRectangle[2].y - this.innerRectangle[3].y)));
            
            pathSource = new Vertex((this.innerRectangle[0].x + this.innerRectangle[3].x) / 2, (this.innerRectangle[0].y + this.innerRectangle[3].y) / 2);
            pathDest = findIntersection(this.vertices[0], this.vertices[3], pathSource, new Vertex((this.innerRectangle[1].x + this.innerRectangle[2].x) / 2, (this.innerRectangle[1].y + this.innerRectangle[2].y) / 2));
        }

        let trees = [];
        for (let x = Math.min(this.margin[0].x, this.margin[1].x, this.margin[2].x, this.margin[3].x); x < Math.max(this.margin[0].x, this.margin[1].x, this.margin[2].x, this.margin[3].x); x += 1 * settings.subcellMargin) {
            for (let y = Math.min(this.margin[0].y, this.margin[1].y, this.margin[2].y, this.margin[3].y); y < Math.max(this.margin[0].y, this.margin[1].y, this.margin[2].y, this.margin[3].y); y += 1 * settings.subcellMargin) {
                for (let i = 0; i < 5; i++) {
                    let tree = new Vertex(random(x + 0.2 * settings.subcellMargin, x + 0.8 * settings.subcellMargin), random(y + 0.2 * settings.subcellMargin, y + 0.8 * settings.subcellMargin));
                    if (isPointWithinQuadrilateral(this.margin, tree) && !isPointWithinQuadrilateral(area, tree)) {
                        trees.push(new Tree(tree, randomFloat(0.2, 0.5) * settings.subcellMargin));
                        break;
                    }
                }
            }
        }

        ctx.fillStyle = '#62aa36';
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (const vertex of this.vertices) {
            ctx.lineTo(vertex.x, vertex.y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#e7bf7b';
        ctx.lineWidth = 1.5 * settings.roadWidth;
        ctx.beginPath();
        ctx.moveTo(pathSource.x, pathSource.y);
        ctx.lineTo(pathDest.x, pathDest.y);
        ctx.stroke();

        ctx.fillStyle = '#95a5a6';
        ctx.beginPath();
        ctx.moveTo(this.innerRectangle[0].x, this.innerRectangle[0].y);
        ctx.lineTo(this.innerRectangle[1].x, this.innerRectangle[1].y);
        ctx.lineTo(this.innerRectangle[2].x, this.innerRectangle[2].y);
        ctx.lineTo(this.innerRectangle[3].x, this.innerRectangle[3].y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = settings.subcellMargin;
        ctx.beginPath();
        ctx.moveTo((this.innerRectangle[0].x + this.innerRectangle[1].x) / 2, (this.innerRectangle[0].y + this.innerRectangle[1].y) / 2);
        ctx.arcTo(this.innerRectangle[1].x, this.innerRectangle[1].y, this.innerRectangle[2].x, this.innerRectangle[2].y, 2);
        ctx.arcTo(this.innerRectangle[2].x, this.innerRectangle[2].y, this.innerRectangle[3].x, this.innerRectangle[3].y, 2);
        ctx.arcTo(this.innerRectangle[3].x, this.innerRectangle[3].y, this.innerRectangle[0].x, this.innerRectangle[0].y, 2);
        ctx.arcTo(this.innerRectangle[0].x, this.innerRectangle[0].y, (this.innerRectangle[0].x + this.innerRectangle[1].x) / 2, (this.innerRectangle[0].y + this.innerRectangle[1].y) / 2, 2);
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = '#a65a4c';
        ctx.beginPath();
        ctx.moveTo(palace[0].x, palace[0].y);
        for (const vertex of palace) {
            ctx.lineTo(vertex.x, vertex.y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#85483d';
        if (orientation == 0) {
            ctx.beginPath();
            ctx.moveTo(palace[0].x, palace[0].y);
            ctx.lineTo((palace[0].x + palace[5].x) / 2, (palace[0].y + palace[5].y) / 2);
            ctx.lineTo((palace[6].x + palace[7].x) / 2, (palace[6].y + palace[7].y) / 2);
            ctx.lineTo(palace[7].x, palace[7].y);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo((palace[0].x + palace[5].x) / 2, (palace[0].y + palace[5].y) / 2);
            ctx.lineTo((palace[1].x + palace[4].x) / 2, (palace[1].y + palace[4].y) / 2);
            ctx.lineTo((palace[2].x + palace[3].x) / 2, (palace[2].y + palace[3].y) / 2);
            ctx.lineTo(palace[3].x, palace[3].y);
            ctx.lineTo(palace[4].x, palace[4].y);
            ctx.lineTo(palace[5].x, palace[5].y);
            ctx.closePath();
            ctx.fill();
        }
        else if (orientation == 1) {
            ctx.beginPath();
            ctx.moveTo(palace[0].x, palace[0].y);
            ctx.lineTo((palace[0].x + palace[1].x) / 2, (palace[0].y + palace[1].y) / 2);
            ctx.lineTo((palace[2].x + palace[7].x) / 2, (palace[2].y + palace[7].y) / 2);
            ctx.lineTo((palace[3].x + palace[6].x) / 2, (palace[3].y + palace[6].y) / 2);
            ctx.lineTo(palace[6].x, palace[6].y);
            ctx.lineTo(palace[7].x, palace[7].y);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(palace[4].x, palace[4].y);
            ctx.lineTo((palace[4].x + palace[5].x) / 2, (palace[4].y + palace[5].y) / 2);
            ctx.lineTo((palace[3].x + palace[6].x) / 2, (palace[3].y + palace[6].y) / 2);
            ctx.lineTo(palace[3].x, palace[3].y);
            ctx.closePath();
            ctx.fill();
        }
        else if (orientation == 2) {
            ctx.beginPath();
            ctx.moveTo(palace[0].x, palace[0].y);
            ctx.lineTo((palace[0].x + palace[3].x) / 2, (palace[0].y + palace[3].y) / 2);
            ctx.lineTo((palace[4].x + palace[7].x) / 2, (palace[4].y + palace[7].y) / 2);
            ctx.lineTo((palace[5].x + palace[6].x) / 2, (palace[5].y + palace[6].y) / 2);
            ctx.lineTo(palace[6].x, palace[6].y);
            ctx.lineTo(palace[7].x, palace[7].y);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo((palace[0].x + palace[3].x) / 2, (palace[0].y + palace[3].y) / 2);
            ctx.lineTo((palace[1].x + palace[2].x) / 2, (palace[1].y + palace[2].y) / 2);
            ctx.lineTo(palace[2].x, palace[2].y);
            ctx.lineTo(palace[3].x, palace[3].y);
            ctx.closePath();
            ctx.fill();
        }
        else {
            ctx.beginPath();
            ctx.moveTo((palace[0].x + palace[7].x) / 2, (palace[0].y + palace[7].y) / 2);
            ctx.lineTo((palace[1].x + palace[6].x) / 2, (palace[1].y + palace[6].y) / 2);
            ctx.lineTo((palace[2].x + palace[5].x) / 2, (palace[2].y + palace[5].y) / 2);
            ctx.lineTo(palace[5].x, palace[5].y);
            ctx.lineTo(palace[6].x, palace[6].y);
            ctx.lineTo(palace[7].x, palace[7].y);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo((palace[3].x + palace[4].x) / 2, (palace[3].y + palace[4].y) / 2);
            ctx.lineTo((palace[2].x + palace[5].x) / 2, (palace[2].y + palace[5].y) / 2);
            ctx.lineTo(palace[2].x, palace[2].y);
            ctx.lineTo(palace[3].x, palace[3].y);
            ctx.closePath();
            ctx.fill();
        }

        ctx.strokeStyle = '#7e4d44';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(palace[0].x, palace[0].y);
        for (const vertex of palace) {
            ctx.lineTo(vertex.x, vertex.y);
        }
        ctx.closePath();
        ctx.stroke();

        for (let i = 0; i < 4; i += 2) {
            ctx.beginPath();
            ctx.moveTo(palace[parameters[i]].x, palace[parameters[i]].y);
            ctx.lineTo(palace[parameters[i + 1]].x, palace[parameters[i + 1]].y);
            ctx.stroke();
        }

        for (let i = 4; i < 10; i += 2) {
            ctx.beginPath();
            ctx.moveTo((palace[parameters[i]].x + palace[parameters[i + 1]].x) / 2, (palace[parameters[i]].y + palace[parameters[i + 1]].y) / 2);
            ctx.lineTo((palace[parameters[i + 2]].x + palace[parameters[i + 3]].x) / 2, (palace[parameters[i + 2]].y + palace[parameters[i + 3]].y) / 2);
            ctx.stroke();
        }
        
        ctx.fillStyle = '#7ec850';
        ctx.strokeStyle = '#7bd741'
        ctx.lineWidth = 1;
        for (const lawn of lawns) {
            ctx.beginPath();
            ctx.moveTo(lawn[0].x, lawn[0].y);
            for (const vertex of lawn) {
                ctx.lineTo(vertex.x, vertex.y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        for (const tree of trees) {
            tree.draw();
        }
    }

    drawForest() {
        this.calculateMargin(settings.subcellMargin);

        if (this.type == 0) {
            return;
        }

        let trees = [];
        for (let x = Math.min(this.margin[0].x, this.margin[1].x, this.margin[2].x, this.margin[3].x); x < Math.max(this.margin[0].x, this.margin[1].x, this.margin[2].x, this.margin[3].x); x += 1 * settings.subcellMargin) {
            for (let y = Math.min(this.margin[0].y, this.margin[1].y, this.margin[2].y, this.margin[3].y); y < Math.max(this.margin[0].y, this.margin[1].y, this.margin[2].y, this.margin[3].y); y += 1 * settings.subcellMargin) {
                for (let i = 0; i < 5; i++) {
                    let tree = new Vertex(random(x + 0.2 * settings.subcellMargin, x + 0.8 * settings.subcellMargin), random(y + 0.2 * settings.subcellMargin, y + 0.8 * settings.subcellMargin));
                    if (isPointWithinQuadrilateral(this.margin, tree)) {
                        trees.push(new Tree(tree, randomFloat(0.2, 0.5) * settings.subcellMargin));
                        break;
                    }
                }
            }
        }

        ctx.fillStyle = '#62aa36';
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (const vertex of this.vertices) {
            ctx.lineTo(vertex.x, vertex.y);
        }
        ctx.closePath();
        ctx.fill();

        for (const tree of trees) {
            tree.draw();
        }
    }

    drawGrid() {
        this.boundingBox();
        this.subdivide();

        for (const subcell of this.subcells) {
            subcell.draw();
        }
    }

    divide() {
        let edgeSum1 = calculateDistance(this.vertices[0], this.vertices[1]) + calculateDistance(this.vertices[2], this.vertices[3]);
        let edgeSum2 = calculateDistance(this.vertices[1], this.vertices[2]) + calculateDistance(this.vertices[3], this.vertices[0]);

        if ((edgeSum1 > edgeSum2 && Math.min(calculateDistance(this.vertices[0], this.vertices[1]), calculateDistance(this.vertices[2], this.vertices[3])) < settings.minCellSize) || (edgeSum1 <= edgeSum2 && Math.min(calculateDistance(this.vertices[1], this.vertices[2]), calculateDistance(this.vertices[3], this.vertices[0])) < settings.minCellSize)) {
            return false;
        }

        let divProp1 = random(-1000, 1000);
        let divProp2 = random(-1000, 1000);
        let divProp3 = random(-1000, 1000);
        let divProp4 = random(-1000, 1000);
        let divVertex1;
        let divVertex2;
        let divVertex3;
        let divVertex4;
        let newCell1 = new Cell(this.vertices);

        if (divProp1 < 0) {
            divVertex1 = new Vertex(((1000 - divProp1) * this.vertices[0].x + 1000 * this.vertices[1].x) / (2000 - divProp1), ((1000 - divProp1) * this.vertices[0].y + 1000 * this.vertices[1].y) / (2000 - divProp1));
        }
        else {
            divVertex1 = new Vertex((1000 * this.vertices[0].x + (1000 + divProp1) * this.vertices[1].x) / (2000 + divProp1), (1000 * this.vertices[0].y + (1000 + divProp1) * this.vertices[1].y) / (2000 + divProp1));
        }
        if (divProp2 < 0) {
            divVertex2 = new Vertex(((1000 - divProp2) * this.vertices[2].x + 1000 * this.vertices[3].x) / (2000 - divProp2), ((1000 - divProp2) * this.vertices[2].y + 1000 * this.vertices[3].y) / (2000 - divProp2));
        }
        else {
            divVertex2 = new Vertex((1000 * this.vertices[2].x + (1000 + divProp2) * this.vertices[3].x) / (2000 + divProp2), (1000 * this.vertices[2].y + (1000 + divProp2) * this.vertices[3].y) / (2000 + divProp2));
        }
        if (divProp3 < 0) {
            divVertex3 = new Vertex(((1000 - divProp3) * this.vertices[3].x + 1000 * this.vertices[0].x) / (2000 - divProp3), ((1000 - divProp3) * this.vertices[3].y + 1000 * this.vertices[0].y) / (2000 - divProp3));
        }
        else {
            divVertex3 = new Vertex((1000 * this.vertices[3].x + (1000 + divProp3) * this.vertices[0].x) / (2000 + divProp3), (1000 * this.vertices[3].y + (1000 + divProp3) * this.vertices[0].y) / (2000 + divProp3));
        }
        if (divProp4 < 0) {
            divVertex4 = new Vertex(((1000 - divProp4) * this.vertices[1].x + 1000 * this.vertices[2].x) / (2000 - divProp4), ((1000 - divProp4) * this.vertices[1].y + 1000 * this.vertices[2].y) / (2000 - divProp4));
        }
        else {
            divVertex4 = new Vertex((1000 * this.vertices[1].x + (1000 + divProp4) * this.vertices[2].x) / (2000 + divProp4), (1000 * this.vertices[1].y + (1000 + divProp4) * this.vertices[2].y) / (2000 + divProp4));
        }

        let connectDistance = .15 * settings.minCellSize;

        for (const vertex of verticesList) {
            if (!vertex.equals(this.vertices[0]) && !vertex.equals(this.vertices[1]) && !vertex.equals(this.vertices[2]) && !vertex.equals(this.vertices[3])) {
                if (calculateDistance(divVertex1, vertex) < connectDistance) {
                    divVertex1.setVertex(vertex);
                }
                if (calculateDistance(divVertex2, vertex) < connectDistance) {
                    divVertex2.setVertex(vertex);
                }
                if (calculateDistance(divVertex3, vertex) < connectDistance) {
                    divVertex3.setVertex(vertex);
                }
                if (calculateDistance(divVertex4, vertex) < connectDistance) {
                    divVertex4.setVertex(vertex);
                }
            }
        }

        if (0.8 < edgeSum2 / edgeSum1 && edgeSum2 / edgeSum1 < 1.2) {
            let divVertex5 = findIntersection(divVertex1, divVertex2, divVertex3, divVertex4);
            let newCell2 = new Cell(this.vertices);
            let newCell3 = new Cell(this.vertices);

            newCell1.setVertex(0, divVertex1);
            newCell1.setVertex(2, divVertex4);
            newCell1.setVertex(3, divVertex5);

            newCell2.setVertex(0, divVertex5);
            newCell2.setVertex(1, divVertex4);
            newCell2.setVertex(3, divVertex2);

            newCell3.setVertex(0, divVertex3);
            newCell3.setVertex(1, divVertex5);
            newCell3.setVertex(2, divVertex2);

            this.setVertex(1, divVertex1);
            this.setVertex(2, divVertex5);
            this.setVertex(3, divVertex3);

            cells.push(newCell2);
            cells.push(newCell3);

            addToVertexList(divVertex1);
            addToVertexList(divVertex2);
            addToVertexList(divVertex3);
            addToVertexList(divVertex4);
            addToVertexList(divVertex5);
        }
        else if (edgeSum1 > edgeSum2) {
            newCell1.setVertex(0, divVertex1);
            newCell1.setVertex(3, divVertex2);

            this.setVertex(1, divVertex1);
            this.setVertex(2, divVertex2);

            addToVertexList(divVertex1);
            addToVertexList(divVertex2);
        }
        else {
            newCell1.setVertex(0, divVertex3);
            newCell1.setVertex(1, divVertex4);

            this.setVertex(2, divVertex4);
            this.setVertex(3, divVertex3);

            addToVertexList(divVertex3);
            addToVertexList(divVertex4);
        }

        cells.push(newCell1);

        return true;
    }

    findBoundingBox(baseV1, baseV2, otherV1, otherV2, edge) {
        let obb = [];
        let a1 = (this.vertices[baseV2].y - this.vertices[baseV1].y) / (this.vertices[baseV2].x - this.vertices[baseV1].x);

        if (a1 == 0 || this.vertices[baseV2].x - this.vertices[baseV1].x == 0) {
            if (edge == 1) {
                obb.push(new Vertex(Math.min(this.vertices[baseV1].x, this.vertices[baseV2].x, this.vertices[otherV1].x, this.vertices[otherV2].x), Math.min(this.vertices[baseV1].y, this.vertices[baseV2].y, this.vertices[otherV1].y, this.vertices[otherV2].y)));
                obb.push(new Vertex(Math.max(this.vertices[baseV1].x, this.vertices[baseV2].x, this.vertices[otherV1].x, this.vertices[otherV2].x), Math.min(this.vertices[baseV1].y, this.vertices[baseV2].y, this.vertices[otherV1].y, this.vertices[otherV2].y)));
                obb.push(new Vertex(Math.max(this.vertices[baseV1].x, this.vertices[baseV2].x, this.vertices[otherV1].x, this.vertices[otherV2].x), Math.max(this.vertices[baseV1].y, this.vertices[baseV2].y, this.vertices[otherV1].y, this.vertices[otherV2].y)));
                obb.push(new Vertex(Math.min(this.vertices[baseV1].x, this.vertices[baseV2].x, this.vertices[otherV1].x, this.vertices[otherV2].x), Math.max(this.vertices[baseV1].y, this.vertices[baseV2].y, this.vertices[otherV1].y, this.vertices[otherV2].y)));
            }
            else if (edge == 2) {
                obb.push(new Vertex(Math.max(this.vertices[baseV1].x, this.vertices[baseV2].x, this.vertices[otherV1].x, this.vertices[otherV2].x), Math.min(this.vertices[baseV1].y, this.vertices[baseV2].y, this.vertices[otherV1].y, this.vertices[otherV2].y)));
                obb.push(new Vertex(Math.max(this.vertices[baseV1].x, this.vertices[baseV2].x, this.vertices[otherV1].x, this.vertices[otherV2].x), Math.max(this.vertices[baseV1].y, this.vertices[baseV2].y, this.vertices[otherV1].y, this.vertices[otherV2].y)));
                obb.push(new Vertex(Math.min(this.vertices[baseV1].x, this.vertices[baseV2].x, this.vertices[otherV1].x, this.vertices[otherV2].x), Math.max(this.vertices[baseV1].y, this.vertices[baseV2].y, this.vertices[otherV1].y, this.vertices[otherV2].y)));
                obb.push(new Vertex(Math.min(this.vertices[baseV1].x, this.vertices[baseV2].x, this.vertices[otherV1].x, this.vertices[otherV2].x), Math.min(this.vertices[baseV1].y, this.vertices[baseV2].y, this.vertices[otherV1].y, this.vertices[otherV2].y)));
            }
            else if (edge == 3) {
                obb.push(new Vertex(Math.max(this.vertices[baseV1].x, this.vertices[baseV2].x, this.vertices[otherV1].x, this.vertices[otherV2].x), Math.max(this.vertices[baseV1].y, this.vertices[baseV2].y, this.vertices[otherV1].y, this.vertices[otherV2].y)));
                obb.push(new Vertex(Math.min(this.vertices[baseV1].x, this.vertices[baseV2].x, this.vertices[otherV1].x, this.vertices[otherV2].x), Math.max(this.vertices[baseV1].y, this.vertices[baseV2].y, this.vertices[otherV1].y, this.vertices[otherV2].y)));
                obb.push(new Vertex(Math.min(this.vertices[baseV1].x, this.vertices[baseV2].x, this.vertices[otherV1].x, this.vertices[otherV2].x), Math.min(this.vertices[baseV1].y, this.vertices[baseV2].y, this.vertices[otherV1].y, this.vertices[otherV2].y)));
                obb.push(new Vertex(Math.max(this.vertices[baseV1].x, this.vertices[baseV2].x, this.vertices[otherV1].x, this.vertices[otherV2].x), Math.min(this.vertices[baseV1].y, this.vertices[baseV2].y, this.vertices[otherV1].y, this.vertices[otherV2].y)));
            }
            else {
                obb.push(new Vertex(Math.min(this.vertices[baseV1].x, this.vertices[baseV2].x, this.vertices[otherV1].x, this.vertices[otherV2].x), Math.max(this.vertices[baseV1].y, this.vertices[baseV2].y, this.vertices[otherV1].y, this.vertices[otherV2].y)));
                obb.push(new Vertex(Math.min(this.vertices[baseV1].x, this.vertices[baseV2].x, this.vertices[otherV1].x, this.vertices[otherV2].x), Math.min(this.vertices[baseV1].y, this.vertices[baseV2].y, this.vertices[otherV1].y, this.vertices[otherV2].y)));
                obb.push(new Vertex(Math.max(this.vertices[baseV1].x, this.vertices[baseV2].x, this.vertices[otherV1].x, this.vertices[otherV2].x), Math.min(this.vertices[baseV1].y, this.vertices[baseV2].y, this.vertices[otherV1].y, this.vertices[otherV2].y)));
                obb.push(new Vertex(Math.max(this.vertices[baseV1].x, this.vertices[baseV2].x, this.vertices[otherV1].x, this.vertices[otherV2].x), Math.max(this.vertices[baseV1].y, this.vertices[baseV2].y, this.vertices[otherV1].y, this.vertices[otherV2].y)));
            }
        }
        else {
            obb.push(new Vertex(this.vertices[baseV1].x, this.vertices[baseV1].y));
            obb.push(new Vertex(this.vertices[baseV2].x, this.vertices[baseV2].y));

            let b1 = this.vertices[baseV1].y - a1 * this.vertices[baseV1].x;
            let furtherVertex = pointToLineDistance(a1, b1, this.vertices[otherV1]) > pointToLineDistance(a1, b1, this.vertices[otherV2]) ? this.vertices[otherV1] : this.vertices[otherV2];
            let b2 = furtherVertex.y - a1 * furtherVertex.x;
            let a3 = -1 / a1;
            let b41 = this.vertices[baseV2].y - a3 * this.vertices[baseV2].x;
            let b42 = this.vertices[otherV1].y - a3 * this.vertices[otherV1].x;
            let v2 = findIntersection(this.vertices[baseV1], this.vertices[baseV2], this.vertices[otherV1], new Vertex(this.vertices[otherV1].x - 100, a3 * (this.vertices[otherV1].x - 100) + b42));

            if ((v2.x < Math.min(obb[0].x, obb[1].x) || Math.max(obb[0].x, obb[1].x) < v2.x || v2.y < Math.min(obb[0].y, obb[1].y) || Math.max(obb[0].y, obb[1].y) < v2.y) && calculateDistance(v2, obb[0]) > calculateDistance(v2, obb[1])) {
                obb[1].setVertex(v2);
                obb.push(findIntersection(furtherVertex, new Vertex(furtherVertex.x - 100, a1 * (furtherVertex.x - 100) + b2), v2, this.vertices[otherV1]));
            }
            else {
                obb.push(findIntersection(furtherVertex, new Vertex(furtherVertex.x - 100, a1 * (furtherVertex.x - 100) + b2), this.vertices[baseV2], new Vertex(this.vertices[baseV2].x - 100, a3 * (this.vertices[baseV2].x - 100) + b41)));
            }

            let b3 = this.vertices[otherV2].y - a3 * this.vertices[otherV2].x;
            let v3 = findIntersection(this.vertices[baseV1], this.vertices[baseV2], this.vertices[otherV2], new Vertex(this.vertices[otherV2].x - 100, a3 * (this.vertices[otherV2].x - 100) + b3));

            if ((v3.x < Math.min(obb[0].x, obb[1].x) || Math.max(obb[0].x, obb[1].x) < v3.x || v3.y < Math.min(obb[0].y, obb[1].y) || Math.max(obb[0].y, obb[1].y) < v3.y) && calculateDistance(v3, obb[0]) < calculateDistance(v3, obb[1])) {
                obb[0].setVertex(v3);
            }

            obb.push(new Vertex(obb[2].x - (obb[1].x - obb[0].x), obb[2].y - (obb[1].y - obb[0].y)));
        }

        return {
            0: obb[0],
            1: obb[1],
            2: obb[2],
            3: obb[3]
        };
    }

    boundingBox() {
        let obbCandidate1 = this.findBoundingBox(0, 1, 2, 3, 1);
        let obbCandidate2 = this.findBoundingBox(1, 2, 3, 0, 2);
        let obbCandidate3 = this.findBoundingBox(2, 3, 0, 1, 3);
        let obbCandidate4 = this.findBoundingBox(3, 0, 1, 2, 4);

        let area1 = calculateDistance(obbCandidate1[0], obbCandidate1[1]) * calculateDistance(obbCandidate1[1], obbCandidate1[2]);
        let area2 = calculateDistance(obbCandidate2[0], obbCandidate2[1]) * calculateDistance(obbCandidate2[1], obbCandidate2[2]);
        let area3 = calculateDistance(obbCandidate3[0], obbCandidate3[1]) * calculateDistance(obbCandidate3[1], obbCandidate3[2]);
        let area4 = calculateDistance(obbCandidate4[0], obbCandidate4[1]) * calculateDistance(obbCandidate4[1], obbCandidate4[2]);

        if (area1 == Math.min(area1, area2, area3, area4)) {
            this.obb = {
                0: obbCandidate1[0],
                1: obbCandidate1[1],
                2: obbCandidate1[2],
                3: obbCandidate1[3]
            };
        }
        else if (area2 == Math.min(area1, area2, area3, area4)) {
            this.obb = {
                0: obbCandidate2[3],
                1: obbCandidate2[0],
                2: obbCandidate2[1],
                3: obbCandidate2[2]
            };
        }
        else if (area3 == Math.min(area1, area2, area3, area4)) {
            this.obb = {
                0: obbCandidate3[2],
                1: obbCandidate3[3],
                2: obbCandidate3[0],
                3: obbCandidate3[1]
            };
        }
        else {
            this.obb = {
                0: obbCandidate4[1],
                1: obbCandidate4[2],
                2: obbCandidate4[3],
                3: obbCandidate4[0]
            };
        }
    }

    subdivide() {
        let numOfChurches = 0;

        this.subcells = [];
        let verticalSubcells = [];
        
        let gridWidth = Math.round(calculateDistance(this.obb[0], this.obb[1]) / settings.minSubcellSize) + random(-1, 1);
        gridWidth = gridWidth < 2 ? 2 : gridWidth;
        let subcellIncWX = (this.obb[1].x - this.obb[0].x) / gridWidth;
        let subcellIncWY = (this.obb[1].y - this.obb[0].y) / gridWidth;

        let prevV0 = new Vertex(this.vertices[0].x, this.vertices[0].y);
        let prevV3 = new Vertex(this.vertices[3].x, this.vertices[3].y);
        let obbPoint0 = new Vertex(this.obb[0].x, this.obb[0].y);
        let obbPoint1 = new Vertex(this.obb[3].x, this.obb[3].y);

        for (let i = 0; i < gridWidth - 1; i++) {
            let offset = random(90, 110) / 100;

            obbPoint0.setX(obbPoint0.x + offset * subcellIncWX);
            obbPoint0.setY(obbPoint0.y + offset * subcellIncWY);
            obbPoint1.setX(obbPoint1.x + offset * subcellIncWX);
            obbPoint1.setY(obbPoint1.y + offset * subcellIncWY);

            let v1 = findIntersection(this.vertices[0], this.vertices[1], obbPoint0, obbPoint1);
            let v2 = findIntersection(this.vertices[3], this.vertices[2], obbPoint0, obbPoint1);

            if (v1.x < Math.min(this.vertices[0].x, this.vertices[1].x) || Math.max(this.vertices[0].x, this.vertices[1].x) < v1.x || v2.x < Math.min(this.vertices[2].x, this.vertices[3].x) || Math.max(this.vertices[2].x, this.vertices[3].x) < v2.x) {
                continue;
            }

            if (calculateDistance(v1, v2) < 0.3 * settings.minSubcellSize) {
                continue;
            }

            verticalSubcells.push(new Subcell([prevV0, v1, v2, prevV3], 0, 1 / (numOfChurches + 1)));

            prevV0.setVertex(v1);
            prevV3.setVertex(v2);
        }

        verticalSubcells.push(new Subcell([prevV0, this.vertices[1], this.vertices[2], prevV3], 0, 1 / (numOfChurches + 1)));

        let gridHeight = Math.round(calculateDistance(this.obb[1], this.obb[2]) / settings.minSubcellSize) + random(-1, 1);
        gridHeight = gridHeight < 2 ? 2 : gridHeight;
        let subcellIncHX = (this.obb[3].x - this.obb[0].x) / gridHeight;
        let subcellIncHY = (this.obb[3].y - this.obb[0].y) / gridHeight;

        for (const subcell of verticalSubcells) {
            prevV0 = new Vertex(subcell.vertices[0].x, subcell.vertices[0].y);
            let prevV1 = new Vertex(subcell.vertices[1].x, subcell.vertices[1].y);
            obbPoint0 = new Vertex(this.obb[0].x, this.obb[0].y);
            obbPoint1 = new Vertex(this.obb[1].x, this.obb[1].y);

            for (let i = 0; i < gridHeight - 1; i++) {
                obbPoint0.setX(obbPoint0.x + subcellIncHX);
                obbPoint0.setY(obbPoint0.y + subcellIncHY);
                obbPoint1.setX(obbPoint1.x + subcellIncHX);
                obbPoint1.setY(obbPoint1.y + subcellIncHY);

                let v2 = findIntersection(subcell.vertices[1], subcell.vertices[2], obbPoint0, obbPoint1);
                let v3 = findIntersection(subcell.vertices[0], subcell.vertices[3], obbPoint0, obbPoint1);

                if (v2.x < Math.min(subcell.vertices[1].x, subcell.vertices[2].x) || Math.max(subcell.vertices[1].x, subcell.vertices[2].x) < v2.x || v2.y < Math.min(subcell.vertices[1].y, subcell.vertices[2].y) || Math.max(subcell.vertices[1].y, subcell.vertices[2].y) < v2.y || v3.x < Math.min(subcell.vertices[0].x, subcell.vertices[3].x) || Math.max(subcell.vertices[0].x, subcell.vertices[3].x) < v3.x || v3.y < Math.min(subcell.vertices[0].y, subcell.vertices[3].y) || Math.max(subcell.vertices[0].y, subcell.vertices[3].y) < v3.y) {
                    continue;
                }

                if (calculateDistance(v2, v3) < 0.3 * settings.minSubcellSize) {
                    continue;
                }

                this.subcells.push(new Subcell([prevV0, prevV1, v2, v3], this.neighbourhood, 1 / (numOfChurches + 1)));

                if (this.subcells[this.subcells.length - 1].type == 3) {
                    numOfChurches++;
                }

                prevV0.setVertex(v3);
                prevV1.setVertex(v2);
            }

            this.subcells.push(new Subcell([prevV0, prevV1, subcell.vertices[2], subcell.vertices[3]], this.neighbourhood, 1 / (numOfChurches + 1)));
        }
    }

    calculateMargin(cellMargin) {
        this.margin = [];

        let crossPoint = findIntersection(this.vertices[0], this.vertices[2], this.vertices[1], this.vertices[3]);

        let edgeDifX1 = Math.abs(cellMargin * (this.vertices[1].y - this.vertices[0].y) / calculateDistance(this.vertices[0], this.vertices[1]));
        let edgeDifY1 = Math.abs(cellMargin * (this.vertices[1].x - this.vertices[0].x) / calculateDistance(this.vertices[0], this.vertices[1]));
        
        let v11a = new Vertex(this.vertices[0].x + edgeDifX1, this.vertices[0].y + edgeDifY1);
        let v12a = new Vertex(this.vertices[1].x + edgeDifX1, this.vertices[1].y + edgeDifY1);
        let v11b = new Vertex(this.vertices[0].x + edgeDifX1, this.vertices[0].y - edgeDifY1);
        let v12b = new Vertex(this.vertices[1].x + edgeDifX1, this.vertices[1].y - edgeDifY1);
        let v11c = new Vertex(this.vertices[0].x - edgeDifX1, this.vertices[0].y - edgeDifY1);
        let v12c = new Vertex(this.vertices[1].x - edgeDifX1, this.vertices[1].y - edgeDifY1);
        let v11d = new Vertex(this.vertices[0].x - edgeDifX1, this.vertices[0].y + edgeDifY1);
        let v12d = new Vertex(this.vertices[1].x - edgeDifX1, this.vertices[1].y + edgeDifY1);
        let v11 = new Vertex(0, 0);
        let v12 = new Vertex(0, 0);

        if (Math.abs(pointToLineDistanceByVertices(this.vertices[0], this.vertices[1], v11a) - cellMargin) < Math.abs(pointToLineDistanceByVertices(this.vertices[0], this.vertices[1], v11b) - cellMargin)) {
            if (pointToLineDistanceByVertices(v11a, v12a, crossPoint) < pointToLineDistanceByVertices(v11c, v12c, crossPoint)) {
                v11.setVertex(v11a);
                v12.setVertex(v12a);
            }
            else {
                v11.setVertex(v11c);
                v12.setVertex(v12c);
            }
        }
        else {
            if (pointToLineDistanceByVertices(v11b, v12b, crossPoint) < pointToLineDistanceByVertices(v11d, v12d, crossPoint)) {
                v11.setVertex(v11b);
                v12.setVertex(v12b);
            }
            else {
                v11.setVertex(v11d);
                v12.setVertex(v12d);
            }
        }

        let edgeDifX2 = Math.abs(cellMargin * (this.vertices[2].y - this.vertices[1].y) / calculateDistance(this.vertices[1], this.vertices[2]));
        let edgeDifY2 = Math.abs(cellMargin * (this.vertices[2].x - this.vertices[1].x) / calculateDistance(this.vertices[1], this.vertices[2]));
        
        let v21a = new Vertex(this.vertices[1].x + edgeDifX2, this.vertices[1].y + edgeDifY2);
        let v22a = new Vertex(this.vertices[2].x + edgeDifX2, this.vertices[2].y + edgeDifY2);
        let v21b = new Vertex(this.vertices[1].x + edgeDifX2, this.vertices[1].y - edgeDifY2);
        let v22b = new Vertex(this.vertices[2].x + edgeDifX2, this.vertices[2].y - edgeDifY2);
        let v21c = new Vertex(this.vertices[1].x - edgeDifX2, this.vertices[1].y - edgeDifY2);
        let v22c = new Vertex(this.vertices[2].x - edgeDifX2, this.vertices[2].y - edgeDifY2);
        let v21d = new Vertex(this.vertices[1].x - edgeDifX2, this.vertices[1].y + edgeDifY2);
        let v22d = new Vertex(this.vertices[2].x - edgeDifX2, this.vertices[2].y + edgeDifY2);
        let v21 = new Vertex(0, 0);
        let v22 = new Vertex(0, 0);

        if (Math.abs(pointToLineDistanceByVertices(this.vertices[1], this.vertices[2], v21a) - cellMargin) < Math.abs(pointToLineDistanceByVertices(this.vertices[1], this.vertices[2], v21b) - cellMargin)) {
            if (pointToLineDistanceByVertices(v21a, v22a, crossPoint) < pointToLineDistanceByVertices(v21c, v22c, crossPoint)) {
                v21.setVertex(v21a);
                v22.setVertex(v22a);
            }
            else {
                v21.setVertex(v21c);
                v22.setVertex(v22c);
            }
        }
        else {
            if (pointToLineDistanceByVertices(v21b, v22b, crossPoint) < pointToLineDistanceByVertices(v21d, v22d, crossPoint)) {
                v21.setVertex(v21b);
                v22.setVertex(v22b);
            }
            else {
                v21.setVertex(v21d);
                v22.setVertex(v22d);
            }
        }

        let edgeDifX3 = Math.abs(cellMargin * (this.vertices[3].y - this.vertices[2].y) / calculateDistance(this.vertices[2], this.vertices[3]));
        let edgeDifY3 = Math.abs(cellMargin * (this.vertices[3].x - this.vertices[2].x) / calculateDistance(this.vertices[2], this.vertices[3]));
        
        let v31a = new Vertex(this.vertices[2].x + edgeDifX3, this.vertices[2].y + edgeDifY3);
        let v32a = new Vertex(this.vertices[3].x + edgeDifX3, this.vertices[3].y + edgeDifY3);
        let v31b = new Vertex(this.vertices[2].x + edgeDifX3, this.vertices[2].y - edgeDifY3);
        let v32b = new Vertex(this.vertices[3].x + edgeDifX3, this.vertices[3].y - edgeDifY3);
        let v31c = new Vertex(this.vertices[2].x - edgeDifX3, this.vertices[2].y - edgeDifY3);
        let v32c = new Vertex(this.vertices[3].x - edgeDifX3, this.vertices[3].y - edgeDifY3);
        let v31d = new Vertex(this.vertices[2].x - edgeDifX3, this.vertices[2].y + edgeDifY3);
        let v32d = new Vertex(this.vertices[3].x - edgeDifX3, this.vertices[3].y + edgeDifY3);
        let v31 = new Vertex(0, 0);
        let v32 = new Vertex(0, 0);

        if (Math.abs(pointToLineDistanceByVertices(this.vertices[2], this.vertices[3], v31a) - cellMargin) < Math.abs(pointToLineDistanceByVertices(this.vertices[2], this.vertices[3], v31b) - cellMargin)) {
            if (pointToLineDistanceByVertices(v31a, v32a, crossPoint) < pointToLineDistanceByVertices(v31c, v32c, crossPoint)) {
                v31.setVertex(v31a);
                v32.setVertex(v32a);
            }
            else {
                v31.setVertex(v31c);
                v32.setVertex(v32c);
            }
        }
        else {
            if (pointToLineDistanceByVertices(v31b, v32b, crossPoint) < pointToLineDistanceByVertices(v31d, v32d, crossPoint)) {
                v31.setVertex(v31b);
                v32.setVertex(v32b);
            }
            else {
                v31.setVertex(v31d);
                v32.setVertex(v32d);
            }
        }

        let edgeDifX4 = Math.abs(cellMargin * (this.vertices[0].y - this.vertices[3].y) / calculateDistance(this.vertices[0], this.vertices[3]));
        let edgeDifY4 = Math.abs(cellMargin * (this.vertices[0].x - this.vertices[3].x) / calculateDistance(this.vertices[0], this.vertices[3]));
        
        let v41a = new Vertex(this.vertices[3].x + edgeDifX4, this.vertices[3].y + edgeDifY4);
        let v42a = new Vertex(this.vertices[0].x + edgeDifX4, this.vertices[0].y + edgeDifY4);
        let v41b = new Vertex(this.vertices[3].x + edgeDifX4, this.vertices[3].y - edgeDifY4);
        let v42b = new Vertex(this.vertices[0].x + edgeDifX4, this.vertices[0].y - edgeDifY4);
        let v41c = new Vertex(this.vertices[3].x - edgeDifX4, this.vertices[3].y - edgeDifY4);
        let v42c = new Vertex(this.vertices[0].x - edgeDifX4, this.vertices[0].y - edgeDifY4);
        let v41d = new Vertex(this.vertices[3].x - edgeDifX4, this.vertices[3].y + edgeDifY4);
        let v42d = new Vertex(this.vertices[0].x - edgeDifX4, this.vertices[0].y + edgeDifY4);
        let v41 = new Vertex(0, 0);
        let v42 = new Vertex(0, 0);

        if (Math.abs(pointToLineDistanceByVertices(this.vertices[0], this.vertices[3], v41a) - cellMargin) < Math.abs(pointToLineDistanceByVertices(this.vertices[0], this.vertices[3], v41b) - cellMargin)) {
            if (pointToLineDistanceByVertices(v41a, v42a, crossPoint) < pointToLineDistanceByVertices(v41c, v42c, crossPoint)) {
                v41.setVertex(v41a);
                v42.setVertex(v42a);
            }
            else {
                v41.setVertex(v41c);
                v42.setVertex(v42c);
            }
        }
        else {
            if (pointToLineDistanceByVertices(v41b, v42b, crossPoint) < pointToLineDistanceByVertices(v41d, v42d, crossPoint)) {
                v41.setVertex(v41b);
                v42.setVertex(v42b);
            }
            else {
                v41.setVertex(v41d);
                v42.setVertex(v42d);
            }
        }

        this.margin.push(findIntersection(v41, v42, v11, v12));
        this.margin.push(findIntersection(v11, v12, v21, v22));
        this.margin.push(findIntersection(v21, v22, v31, v32));
        this.margin.push(findIntersection(v31, v32, v41, v42));
        
        if (calculateDistance(this.margin[0], this.vertices[0]) > Math.min(calculateDistance(this.margin[1], this.vertices[0]), calculateDistance(this.margin[2], this.vertices[0]), calculateDistance(this.margin[3], this.vertices[0])) || calculateDistance(this.margin[1], this.vertices[1]) > Math.min(calculateDistance(this.margin[0], this.vertices[1]), calculateDistance(this.margin[2], this.vertices[1]), calculateDistance(this.margin[3], this.vertices[1])) || calculateDistance(this.margin[2], this.vertices[2]) > Math.min(calculateDistance(this.margin[0], this.vertices[2]), calculateDistance(this.margin[1], this.vertices[2]), calculateDistance(this.margin[3], this.vertices[2])) || calculateDistance(this.margin[3], this.vertices[3]) > Math.min(calculateDistance(this.margin[0], this.vertices[3]), calculateDistance(this.margin[1], this.vertices[3]), calculateDistance(this.margin[2], this.vertices[3]))) {
            this.type = 0;
        }
    }

    calculateInnerRectangle(baseV1, baseV2, otherV1, otherV2, color) {
        let v0 = new Vertex(baseV1.x, baseV1.y);
        let v1 = new Vertex(baseV2.x, baseV2.y);

        let v2 = new Vertex(baseV2.x - (baseV1.y - baseV2.y), baseV2.y + (baseV1.x - baseV2.x));
        let v3 = new Vertex(baseV1.x - (baseV2.y - baseV1.y), baseV1.y + (baseV2.x - baseV1.x));

        v2 = findIntersection(v1, v2, otherV1, otherV2);
        v3 = findIntersection(v0, v3, otherV1, otherV2);

        if (v2.x < Math.min(otherV1.x, otherV2.x) || Math.max(otherV1.x, otherV2.x) < v2.x) {
            v1.setX(v1.x + (otherV1.x - v2.x));
            v1.setY(v1.y + (otherV1.y - v2.y));
            v2.setVertex(otherV1);

            v1 = findIntersection(v1, v2, baseV1, baseV2);
        }

        if (v3.x < Math.min(otherV1.x, otherV2.x) || Math.max(otherV1.x, otherV2.x) < v3.x) {
            v0.setX(v0.x + (otherV2.x - v3.x));
            v0.setY(v0.y + (otherV2.y - v3.y));
            v3.setVertex(otherV2);

            v0 = findIntersection(v0, v3, baseV1, baseV2);
        }

        if (calculateDistance(v0, v3) < calculateDistance(v1, v2)) {
            v2 = findIntersection(v3, new Vertex(v3.x - (v0.y - v3.y), v3.y + (v0.x - v3.x)), v1, v2);
        }
        else {
            v3 = findIntersection(v2, new Vertex(v2.x - (v1.y - v2.y), v2.y + (v1.x - v2.x)), v0, v3);
        }

        if (calculateDistance(v0, this.margin[0]) > Math.min(calculateDistance(v1, this.margin[0]), calculateDistance(v2, this.margin[0]), calculateDistance(v3, this.margin[0])) || calculateDistance(v1, this.margin[1]) > Math.min(calculateDistance(v0, this.margin[1]), calculateDistance(v2, this.margin[1]), calculateDistance(v3, this.margin[1])) || calculateDistance(v2, this.margin[2]) > Math.min(calculateDistance(v0, this.margin[2]), calculateDistance(v1, this.margin[2]), calculateDistance(v3, this.margin[2])) || calculateDistance(v3, this.margin[3]) > Math.min(calculateDistance(v0, this.margin[3]), calculateDistance(v1, this.margin[3]), calculateDistance(v2, this.margin[3]))) {
            return null;
        }

        return {
            0: v0,
            1: v1,
            2: v2,
            3: v3
        };
    }

    getInnerRectangle() {
        this.innerRectangle = null;

        let rect1 = this.calculateInnerRectangle(this.margin[0], this.margin[1], this.margin[2], this.margin[3], 'red');
        let rect2 = this.calculateInnerRectangle(this.margin[1], this.margin[2], this.margin[3], this.margin[0], 'yellow');
        let rect3 = this.calculateInnerRectangle(this.margin[2], this.margin[3], this.margin[0], this.margin[1], 'green');
        let rect4 = this.calculateInnerRectangle(this.margin[3], this.margin[0], this.margin[1], this.margin[2], 'blue');

        let area1 = rect1 == null ? 0 : calculateDistance(rect1[0], rect1[1]) * calculateDistance(rect1[1], rect1[2]);
        let area2 = rect2 == null ? 0 : calculateDistance(rect2[0], rect2[1]) * calculateDistance(rect2[1], rect2[2]);
        let area3 = rect3 == null ? 0 : calculateDistance(rect3[0], rect3[1]) * calculateDistance(rect3[1], rect3[2]);
        let area4 = rect4 == null ? 0 : calculateDistance(rect4[0], rect4[1]) * calculateDistance(rect4[1], rect4[2]);

        if (area1 == Math.max(area1, area2, area3, area4) && rect1 != null) {
            this.innerRectangle = {
                0: rect1[0],
                1: rect1[1],
                2: rect1[2],
                3: rect1[3]
            };
        }
        else if (area2 == Math.max(area1, area2, area3, area4) && rect2 != null) {
            this.innerRectangle = {
                0: rect2[3],
                1: rect2[0],
                2: rect2[1],
                3: rect2[2]
            };
        }
        else if (area3 == Math.max(area1, area2, area3, area4) && rect3 != null) {
            this.innerRectangle = {
                0: rect3[2],
                1: rect3[3],
                2: rect3[0],
                3: rect3[1]
            };
        }
        else if (rect4 != null) {
            this.innerRectangle = {
                0: rect4[1],
                1: rect4[2],
                2: rect4[3],
                3: rect4[0]
            };
        }
        else {
            this.innerRectangle = null;
            return;
        }
    }

    shortenInnerRectangle(maxWidth, maxHeight) {
        if (this.innerRectangle == null) {
            return;
        }

        let shortenedRectangle = [];
        let shorten1 = 0;
        let shorten2 = 0;

        while ((1 - 2 * shorten1) * calculateDistance(this.innerRectangle[1], this.innerRectangle[2]) > maxWidth) {
            shorten1 += 0.05;
        }

        while ((1 - 2 * shorten2) * calculateDistance(this.innerRectangle[0], this.innerRectangle[1]) > maxHeight) {
            shorten2 += 0.05;
        }

        for (let i in [0, 1, 2, 3]) {
            shortenedRectangle.push(new Vertex(this.innerRectangle[i].x, this.innerRectangle[i].y));
        }

        shortenedRectangle[0].setX(shortenedRectangle[0].x + shorten1 * (this.innerRectangle[2].x - this.innerRectangle[1].x));
        shortenedRectangle[0].setY(shortenedRectangle[0].y + shorten1 * (this.innerRectangle[2].y - this.innerRectangle[1].y));
        shortenedRectangle[0].setX(shortenedRectangle[0].x + shorten2 * (this.innerRectangle[1].x - this.innerRectangle[0].x));
        shortenedRectangle[0].setY(shortenedRectangle[0].y + shorten2 * (this.innerRectangle[1].y - this.innerRectangle[0].y));
        shortenedRectangle[1].setX(shortenedRectangle[1].x + shorten1 * (this.innerRectangle[2].x - this.innerRectangle[1].x));
        shortenedRectangle[1].setY(shortenedRectangle[1].y + shorten1 * (this.innerRectangle[2].y - this.innerRectangle[1].y));
        shortenedRectangle[1].setX(shortenedRectangle[1].x + shorten2 * (this.innerRectangle[0].x - this.innerRectangle[1].x));
        shortenedRectangle[1].setY(shortenedRectangle[1].y + shorten2 * (this.innerRectangle[0].y - this.innerRectangle[1].y));
        shortenedRectangle[2].setX(shortenedRectangle[2].x + shorten1 * (this.innerRectangle[1].x - this.innerRectangle[2].x));
        shortenedRectangle[2].setY(shortenedRectangle[2].y + shorten1 * (this.innerRectangle[1].y - this.innerRectangle[2].y));
        shortenedRectangle[2].setX(shortenedRectangle[2].x + shorten2 * (this.innerRectangle[0].x - this.innerRectangle[1].x));
        shortenedRectangle[2].setY(shortenedRectangle[2].y + shorten2 * (this.innerRectangle[0].y - this.innerRectangle[1].y));
        shortenedRectangle[3].setX(shortenedRectangle[3].x + shorten1 * (this.innerRectangle[1].x - this.innerRectangle[2].x));
        shortenedRectangle[3].setY(shortenedRectangle[3].y + shorten1 * (this.innerRectangle[1].y - this.innerRectangle[2].y));
        shortenedRectangle[3].setX(shortenedRectangle[3].x + shorten2 * (this.innerRectangle[1].x - this.innerRectangle[0].x));
        shortenedRectangle[3].setY(shortenedRectangle[3].y + shorten2 * (this.innerRectangle[1].y - this.innerRectangle[0].y));
    
        for (let i in [0, 1, 2, 3]) {
            this.innerRectangle[i].setVertex(shortenedRectangle[i]);
        }
    }
}

class River {
    constructor() {
        this.river = [];
        this.vertices = [];
    }

    generate() {
        this.river.push(new Vertex(random(Math.round(0.4 * width), Math.round(0.6 * width)), 0));
        this.river.push(new Vertex(random(Math.round(0.4 * width), Math.round(0.6 * width)), random(Math.round(0.2 * height), Math.round(0.3 * height))));
        this.river.push(new Vertex(random(Math.round(0.4 * width), Math.round(0.6 * width)), random(Math.round(0.7 * height), Math.round(0.8 * height))));
        this.river.push(new Vertex(random(Math.round(0.4 * width), Math.round(0.6 * width)), height));
        
        let wraps = [];
        let offsetX1 = settings.riverWidth * calculateDistance(this.river[0], this.river[1]) / this.river[1].y;
        let offsetX2 = settings.riverWidth * calculateDistance(this.river[1], this.river[2]) / (this.river[2].y - this.river[1].y);
        let offsetX3 = settings.riverWidth * calculateDistance(this.river[2], this.river[3]) / (this.river[3].y - this.river[2].y);

        wraps.push([]);
        wraps[0].push(new Vertex(this.river[0].x - offsetX1, this.river[0].y));
        wraps[0].push(new Vertex(this.river[0].x + offsetX1, this.river[0].y));
        wraps[0].push(new Vertex(this.river[1].x + offsetX1, this.river[1].y));
        wraps[0].push(new Vertex(this.river[1].x - offsetX1, this.river[1].y));

        wraps.push([]);
        wraps[1].push(new Vertex(this.river[1].x - offsetX2, this.river[1].y));
        wraps[1].push(new Vertex(this.river[1].x + offsetX2, this.river[1].y));
        wraps[1].push(new Vertex(this.river[2].x + offsetX2, this.river[2].y));
        wraps[1].push(new Vertex(this.river[2].x - offsetX2, this.river[2].y));

        wraps.push([]);
        wraps[2].push(new Vertex(this.river[2].x - offsetX3, this.river[2].y));
        wraps[2].push(new Vertex(this.river[2].x + offsetX3, this.river[2].y));
        wraps[2].push(new Vertex(this.river[3].x + offsetX3, this.river[3].y));
        wraps[2].push(new Vertex(this.river[3].x - offsetX3, this.river[3].y));

        this.vertices.push(new Vertex(wraps[0][0].x, wraps[0][0].y));
        this.vertices.push(new Vertex(wraps[0][1].x, wraps[0][1].y));
        this.vertices.push(findIntersection(wraps[0][1], wraps[0][2], wraps[1][1], wraps[1][2]));
        this.vertices.push(findIntersection(wraps[1][1], wraps[1][2], wraps[2][1], wraps[2][2]));
        this.vertices.push(new Vertex(wraps[2][2].x, wraps[2][2].y));
        this.vertices.push(new Vertex(wraps[2][3].x, wraps[2][3].y));
        this.vertices.push(findIntersection(wraps[1][0], wraps[1][3], wraps[2][0], wraps[2][3]));
        this.vertices.push(findIntersection(wraps[0][0], wraps[0][3], wraps[1][0], wraps[1][3]));

        let offsetY1 = randomFloat(-0.1, 0.1) * height;        
        let offsetY2 = randomFloat(-0.1, 0.1) * height;        
        let offsetY3 = randomFloat(-0.1, 0.1) * height;        
        let offsetY4 = randomFloat(-0.1, 0.1) * height;

        cells.push(new Cell([new Vertex(0, 0), this.vertices[0], this.vertices[7], new Vertex(0, this.vertices[7].y + offsetY1)]));
        cells.push(new Cell([new Vertex(0, this.vertices[7].y + offsetY1), this.vertices[7], this.vertices[6], new Vertex(0, this.vertices[6].y + offsetY2)]));
        cells.push(new Cell([new Vertex(0, this.vertices[6].y + offsetY2), this.vertices[6], this.vertices[5], new Vertex(0, height)]));

        cells.push(new Cell([this.vertices[1], new Vertex(width, 0), new Vertex(width, this.vertices[2].y + offsetY3), this.vertices[2]]));
        cells.push(new Cell([this.vertices[2], new Vertex(width, this.vertices[2].y + offsetY3), new Vertex(width, this.vertices[3].y + offsetY4), this.vertices[3]]));
        cells.push(new Cell([this.vertices[3], new Vertex(width, this.vertices[3].y + offsetY4), new Vertex(width, height), this.vertices[4]]));
    }

    draw() {
        ctx.fillStyle = '#7ec850';
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (const vertex of this.vertices) {
            ctx.lineTo(vertex.x, vertex.y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = settings.riverWidth;
        ctx.beginPath();
        ctx.moveTo(this.river[0].x + 0.1 * (this.river[0].x - this.river[1].x), this.river[0].y + 0.1 * (this.river[0].y - this.river[1].y));
        for (let i = 1; i < 3; i++) {
            ctx.arcTo(this.river[i].x, this.river[i].y, this.river[i + 1].x, this.river[i + 1].y, 2 * settings.riverWidth);
        }
        ctx.lineTo(this.river[3].x + 0.1 * (this.river[3].x - this.river[2].x), this.river[3].y + 0.1 * (this.river[3].y - this.river[2].y));
        ctx.stroke();

        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = settings.riverWidth - 8;
        ctx.beginPath();
        ctx.moveTo(this.river[0].x + 0.1 * (this.river[0].x - this.river[1].x), this.river[0].y + 0.1 * (this.river[0].y - this.river[1].y));
        for (let i = 1; i < 3; i++) {
            ctx.arcTo(this.river[i].x, this.river[i].y, this.river[i + 1].x, this.river[i + 1].y, 2 * settings.riverWidth);
        }
        ctx.lineTo(this.river[3].x + 0.1 * (this.river[3].x - this.river[2].x), this.river[3].y + 0.1 * (this.river[3].y - this.river[2].y));
        ctx.stroke();

        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 2 * settings.roadWidth;
        ctx.beginPath();
        ctx.moveTo(this.vertices[2].x, this.vertices[2].y);
        ctx.lineTo(this.vertices[7].x, this.vertices[7].y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.vertices[3].x, this.vertices[3].y);
        ctx.lineTo(this.vertices[6].x, this.vertices[6].y);
        ctx.stroke();
    }
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function randomRGB(minR, maxR, minG, maxG, minB, maxB) {
    return `rgb(${random(minR, maxR)},${random(minG, maxG)},${random(minB, maxB)})`;
}

function calculateDistance(v1, v2) {
    return Math.sqrt((v1.x - v2.x) * (v1.x - v2.x) + (v1.y - v2.y) * (v1.y - v2.y));
}

function findIntersection(v1, v2, v3, v4) {
    return new Vertex(((v1.x * v2.y - v1.y * v2.x) * (v3.x - v4.x) - (v1.x - v2.x) * (v3.x * v4.y - v3.y * v4.x)) / ((v1.x - v2.x) * (v3.y - v4.y) - (v1.y - v2.y) * (v3.x - v4.x)), ((v1.x * v2.y - v1.y * v2.x) * (v3.y - v4.y) - (v1.y - v2.y) * (v3.x * v4.y - v3.y * v4.x)) / ((v1.x - v2.x) * (v3.y - v4.y) - (v1.y - v2.y) * (v3.x - v4.x)));
}

function pointToLineDistance(a, b, v) {
    return Math.abs(a * v.x - v.y + b) / Math.sqrt(a * a + 1);
}

function pointToLineDistanceByVertices(v1, v2, point) {
    return Math.abs((v2.x - v1.x) * (v1.y - point.y) - (v1.x - point.x) * (v2.y - v1.y)) / Math.sqrt((v2.x - v1.x) * (v2.x - v1.x) + (v2.y - v1.y) * (v2.y - v1.y));
}

function calculateTriangleArea(a, b, c) {
    return Math.abs(a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
}

function isPointWithinQuadrilateral(quadrilateral, point) {
    return calculateTriangleArea(quadrilateral[0], quadrilateral[1], point) + calculateTriangleArea(quadrilateral[1], quadrilateral[2], point) + calculateTriangleArea(quadrilateral[2], quadrilateral[3], point) + calculateTriangleArea(quadrilateral[0], quadrilateral[3], point) - 0.1 <= calculateTriangleArea(quadrilateral[0], quadrilateral[1], quadrilateral[3]) + calculateTriangleArea(quadrilateral[1], quadrilateral[2], quadrilateral[3]);
}

function addToVertexList(v) {
    let notInList = true;

    for (const vertex of verticesList) {
        if (v.equals(vertex)) {
            notInList = false;
            break;
        }
    }

    if (notInList) {
        verticesList.push(v);
    }
}

function generate() {
    cells = [];
    verticesList = [];

    if (settings.includeRiver) {
        let river = new River();
        river.generate();
        river.draw();
    }
    else {
        let initialVertices = [];
        initialVertices.push(new Vertex(0, 0));
        initialVertices.push(new Vertex(width, 0));
        initialVertices.push(new Vertex(width, height));
        initialVertices.push(new Vertex(0, height));
        
        cells.push(new Cell(initialVertices));
    }
    
    for (const cell of cells) {
        while (cell.divide());
    }

    draw();
}

function draw() {
    for (const cell of cells) {
        cell.draw();
    }
}

function showSettings() {
    document.getElementById("settings").classList.toggle("show");
}

window.onclick = function (e) {
    if (!e.target.matches(".dropbtn") && !e.target.matches(".inc-dec") && !e.target.matches(".inc-dec-btn") && !e.target.matches(".value") && !e.target.matches(".dropitem-name") && !e.target.matches(".dropdown-content") && !e.target.matches(".dropdown-btn") && !e.target.matches(".dropdown-item")) {
        let dropdowns = document.getElementsByClassName("dropdown-content");
        for (const dropdown of dropdowns) {
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
            }
        }
    }
}

function showSettingsValues() {
    document.getElementById("cell-size").innerHTML = settings.cellProp == 0.2 ? "small" : settings.cellProp == 0.4 ? "medium" : "large";
    document.getElementById("subcell-size").innerHTML = settings.subcellProp == 0.05 ? "small" : settings.subcellProp == 0.1 ? "medium" : "large";
    document.getElementById("outer-inner-prop").innerHTML = settings.outerInnerProp == -0.1 ? "only apartment buildings" : settings.outerInnerProp == 0.2 ? "mostly apartment buildings" : settings.outerInnerProp == 0.5 ? "balanced" : settings.outerInnerProp == 0.8 ? "mostly row houses" : "only row houses";
    document.getElementById("include-river").innerHTML = settings.includeRiver ? "yes" : "no";
    document.getElementById("chance-of-lake").innerHTML = settings.chanceOfLake == 0 ? "none" : settings.chanceOfLake == 0.05 ? "some" : "many";
    document.getElementById("chance-of-forest").innerHTML = settings.chanceOfForest == 0 ? "none" : settings.chanceOfForest == 0.1 ? "some" : "many";
    document.getElementById("chance-of-palace").innerHTML = settings.chanceOfPalace == 0 ? "none" : settings.chanceOfPalace == 0.05 ? "some" : "many";
    document.getElementById("chance-of-gov").innerHTML = settings.chanceOfGov == 0 ? "none" : settings.chanceOfGov == 0.1 ? "some" : "many";
    document.getElementById("chance-of-church").innerHTML = settings.chanceOfChurch == 0 ? "none" : settings.chanceOfChurch == 0.05 ? "some" : "many";
    document.getElementById("chance-of-park").innerHTML = settings.chanceOfPark == 0 ? "none" : settings.chanceOfPark == 0.1 ? "some" : "many";
}

function modifyValue(type, dif) {
    if (type == 0) {
        if ((settings.cellProp == 0.2 && dif == 0.5) || (settings.cellProp == 0.8 && dif == 2)) {
            return;
        }
        settings.setCellSize(dif);
        document.getElementById("cell-size").innerHTML = settings.cellProp == 0.2 ? "small" : settings.cellProp == 0.4 ? "medium" : "large";
    }
    if (type == 1) {
        if ((settings.subcellProp == 0.05 && dif == 0.5) || (settings.subcellProp == 0.2 && dif == 2)) {
            return;
        }
        settings.setSubcellSize(dif);
        document.getElementById("subcell-size").innerHTML = settings.subcellProp == 0.05 ? "small" : settings.subcellProp == 0.1 ? "medium" : "large";
    }
    if (type == 2) {
        if ((settings.outerInnerProp < 0 && dif < 0) || (settings.outerInnerProp > 1 && dif > 0)) {
            return;
        }
        settings.outerInnerProp = Math.round((settings.outerInnerProp + dif + Number.EPSILON) * 10) / 10;
        document.getElementById("outer-inner-prop").innerHTML = settings.outerInnerProp == -0.1 ? "only apartment buildings" : settings.outerInnerProp == 0.2 ? "mostly apartment buildings" : settings.outerInnerProp == 0.5 ? "balanced" : settings.outerInnerProp == 0.8 ? "mostly row houses" : "only row houses";
    }
    if (type == 3) {
        if (dif < 0 && settings.includeRiver) {
            settings.includeRiver = false;
        }
        else if (dif > 0 && !settings.includeRiver) {
            settings.includeRiver = true;
        }
        document.getElementById("include-river").innerHTML = settings.includeRiver ? "yes" : "no";
    }
    if (type == 4) {
        if ((settings.chanceOfLake == 0 && dif < 0) || (settings.chanceOfLake == 0.2 && dif > 0)) {
            return;
        }
        settings.chanceOfLake = dif < 0 ? settings.chanceOfLake == 0.05 ? 0 : 0.05 : settings.chanceOfLake == 0.05 ? 0.2 : 0.05;
        document.getElementById("chance-of-lake").innerHTML = settings.chanceOfLake == 0 ? "none" : settings.chanceOfLake == 0.05 ? "some" : "many";
    }
    if (type == 5) {
        if ((settings.chanceOfForest == 0 && dif < 0) || (settings.chanceOfForest == 0.4 && dif > 0)) {
            return;
        }
        settings.chanceOfForest = dif < 0 ? settings.chanceOfForest == 0.1 ? 0 : 0.1 : settings.chanceOfForest == 0.1 ? 0.4 : 0.1;
        document.getElementById("chance-of-forest").innerHTML = settings.chanceOfForest == 0 ? "none" : settings.chanceOfForest == 0.1 ? "some" : "many";
    }
    if (type == 6) {
        if ((settings.chanceOfPalace == 0 && dif < 0) || (settings.chanceOfPalace == 0.2 && dif > 0)) {
            return;
        }
        settings.chanceOfPalace = dif < 0 ? settings.chanceOfPalace == 0.05 ? 0 : 0.05 : settings.chanceOfPalace == 0.05 ? 0.2 : 0.05;
        document.getElementById("chance-of-palace").innerHTML = settings.chanceOfPalace == 0 ? "none" : settings.chanceOfPalace == 0.05 ? "some" : "many";
    }
    if (type == 7) {
        if ((settings.chanceOfGov == 0 && dif < 0) || (settings.chanceOfGov == 0.4 && dif > 0)) {
            return;
        }
        settings.chanceOfGov = dif < 0 ? settings.chanceOfGov == 0.1 ? 0 : 0.1 : settings.chanceOfGov == 0.1 ? 0.4 : 0.1;
        document.getElementById("chance-of-gov").innerHTML = settings.chanceOfGov == 0 ? "none" : settings.chanceOfGov == 0.1 ? "some" : "many";
    }
    if (type == 8) {
        if ((settings.chanceOfChurch == 0 && dif < 0) || (settings.chanceOfChurch == 0.2 && dif > 0)) {
            return;
        }
        settings.chanceOfChurch = dif < 0 ? settings.chanceOfChurch == 0.05 ? 0 : 0.05 : settings.chanceOfChurch == 0.05 ? 0.2 : 0.05;
        document.getElementById("chance-of-church").innerHTML = settings.chanceOfChurch == 0 ? "none" : settings.chanceOfChurch == 0.05 ? "some" : "many";
    }
    if (type == 9) {
        if ((settings.chanceOfPark == 0 && dif < 0) || (settings.chanceOfPark == 0.4 && dif > 0)) {
            return;
        }
        settings.chanceOfPark = dif < 0 ? settings.chanceOfPark == 0.1 ? 0 : 0.1 : settings.chanceOfPark == 0.1 ? 0.4 : 0.1;
        document.getElementById("chance-of-park").innerHTML = settings.chanceOfPark == 0 ? "none" : settings.chanceOfPark == 0.1 ? "some" : "many";
    }
}

let settings = new Settings();
let cells = [];
let verticesList = [];

generate();