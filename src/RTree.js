// RTree.js

export class RTreeNode {
  constructor(maxEntries = 4, level = 1) {
    this.maxEntries = maxEntries;
    this.level = level; // Nivel del nodo en el árbol
    this.leaf = true;   // Indica si es un nodo hoja
    this.children = [];
    this.boundingBox = null;
  }

  insert(item) {
    if (this.leaf) {
      // Insertar en nodo hoja
      this.children.push(item);
      this.expandBoundingBox(item);

      if (this.children.length > this.maxEntries) {
        return this.split();
      } else {
        return null;
      }
    } else {
      // Insertar en nodo interno
      const bestChild = this.chooseSubtree(item);
      const splitNode = bestChild.insert(item);

      if (splitNode) {
        // Si el hijo se dividió, agregar el nuevo nodo
        this.children.push(splitNode);
        this.expandBoundingBox(splitNode.boundingBox);

        if (this.children.length > this.maxEntries) {
          return this.split();
        }
      } else {
        this.expandBoundingBox(item);
      }
      return null;
    }
  }

  expandBoundingBox(item) {
    const itemBox = item.boundingBox || item;
    if (!this.boundingBox) {
      this.boundingBox = { ...itemBox };
    } else {
      const minX = Math.min(this.boundingBox.x, itemBox.x);
      const minY = Math.min(this.boundingBox.y, itemBox.y);
      const maxX = Math.max(this.boundingBox.x + this.boundingBox.width, itemBox.x + itemBox.width);
      const maxY = Math.max(this.boundingBox.y + this.boundingBox.height, itemBox.y + itemBox.height);
      this.boundingBox = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
    }
  }

  chooseSubtree(item) {
    let bestChild = null;
    let minIncrease = Infinity;

    for (const child of this.children) {
      const areaBefore = this.calculateArea(child.boundingBox);
      const expandedBox = this.calculateBoundingBox(child.boundingBox, item.boundingBox || item);
      const areaAfter = this.calculateArea(expandedBox);
      const increase = areaAfter - areaBefore;

      if (increase < minIncrease) {
        minIncrease = increase;
        bestChild = child;
      } else if (increase === minIncrease) {
        if (areaBefore < this.calculateArea(bestChild.boundingBox)) {
          bestChild = child;
        }
      }
    }
    return bestChild;
  }

  calculateArea(box) {
    return box.width * box.height;
  }

  calculateBoundingBox(box1, box2) {
    const minX = Math.min(box1.x, box2.x);
    const minY = Math.min(box1.y, box2.y);
    const maxX = Math.max(box1.x + box1.width, box2.x + box2.width);
    const maxY = Math.max(box1.y + box1.height, box2.y + box2.height);
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  split() {
    // Dividir los hijos en dos grupos usando el algoritmo de división lineal
    const [group1, group2] = this.linearSplit(this.children);

    // Crear un nuevo nodo con el segundo grupo
    const newNode = new RTreeNode(this.maxEntries, this.level);
    newNode.leaf = this.leaf;
    newNode.children = group2;
    newNode.updateBoundingBox();

    // Actualizar el nodo actual con el primer grupo
    this.children = group1;
    this.updateBoundingBox();

    // Devolver el nuevo nodo para que sea añadido por el padre
    return newNode;
  }

  linearSplit(children) {
    // Implementación simplificada del algoritmo de división lineal
    // Seleccionar dos entradas para iniciar los grupos
    let maxD = -Infinity;
    let pair = [0, 0];

    for (let i = 0; i < children.length - 1; i++) {
      for (let j = i + 1; j < children.length; j++) {
        const rect1 = children[i].boundingBox || children[i];
        const rect2 = children[j].boundingBox || children[j];
        const d = this.distanceBetweenRectangles(rect1, rect2);
        if (d > maxD) {
          maxD = d;
          pair = [i, j];
        }
      }
    }

    const group1 = [children[pair[0]]];
    const group2 = [children[pair[1]]];

    // Asignar el resto de entradas al grupo con menor aumento de área
    for (let k = 0; k < children.length; k++) {
      if (k !== pair[0] && k !== pair[1]) {
        const child = children[k];
        const bbox1 = this.calculateBoundingBox(this.computeBoundingBox(group1), child.boundingBox || child);
        const bbox2 = this.calculateBoundingBox(this.computeBoundingBox(group2), child.boundingBox || child);

        const increase1 = this.calculateArea(bbox1) - this.calculateArea(this.computeBoundingBox(group1));
        const increase2 = this.calculateArea(bbox2) - this.calculateArea(this.computeBoundingBox(group2));

        if (increase1 < increase2) {
          group1.push(child);
        } else {
          group2.push(child);
        }
      }
    }

    return [group1, group2];
  }

  computeBoundingBox(children) {
    let bbox = null;
    for (const child of children) {
      const cbox = child.boundingBox || child;
      if (!bbox) {
        bbox = { ...cbox };
      } else {
        bbox = this.calculateBoundingBox(bbox, cbox);
      }
    }
    return bbox;
  }

  distanceBetweenRectangles(rect1, rect2) {
    const x1 = rect1.x + rect1.width / 2;
    const y1 = rect1.y + rect1.height / 2;
    const x2 = rect2.x + rect2.width / 2;
    const y2 = rect2.y + rect2.height / 2;
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
  }

  updateBoundingBox() {
    this.boundingBox = this.computeBoundingBox(this.children);
  }

  search(area, results = []) {
    if (!this.intersects(this.boundingBox, area)) {
      return results;
    }
    if (this.leaf) {
      for (const item of this.children) {
        if (this.intersects(item, area)) {
          results.push(item);
        }
      }
    } else {
      for (const child of this.children) {
        child.search(area, results);
      }
    }
    return results;
  }

  intersects(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }
}

export class RTree {
  constructor(maxEntries = 4) {
    this.maxEntries = maxEntries;
    this.root = new RTreeNode(maxEntries, 1);
  }

  insert(item) {
    const splitNode = this.root.insert(item);
    if (splitNode) {
      // La raíz se dividió, crear una nueva raíz
      const newRoot = new RTreeNode(this.maxEntries, this.root.level + 1);
      newRoot.leaf = false;
      newRoot.children = [this.root, splitNode];
      newRoot.updateBoundingBox();
      this.root = newRoot;
    }
  }

  search(area) {
    return this.root.search(area);
  }
}
