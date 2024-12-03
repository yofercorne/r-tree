// RTreeVisualizer.js

import React, { useState } from 'react';
import { RTreeNode } from './RTree';
import Tree from 'react-d3-tree';

const RTreeVisualizer = () => {
  const [tree, setTree] = useState(new RTreeNode());
  const [rectangles, setRectangles] = useState([]);
  const [selectedRectangle, setSelectedRectangle] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchArea, setSearchArea] = useState({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });

  const addRectangle = () => {
    const newRect = {
      x: Math.random() * 400,
      y: Math.random() * 400,
      width: Math.random() * 50 + 20,
      height: Math.random() * 50 + 20,
    };
    let newTree = tree;
    const splitNode = newTree.insert(newRect);

    if (splitNode) {
      // Crear un nuevo nodo raíz
      const newRoot = new RTreeNode(newTree.maxEntries, newTree.level + 1);
      newRoot.leaf = false;
      newRoot.children = [newTree, splitNode];
      newRoot.updateBoundingBox();
      newTree = newRoot;
    }

    setTree(newTree);
    setRectangles([...rectangles, newRect]);
    
  };

  const removeRectangle = () => {
    if (!selectedRectangle) return;
    const updatedRectangles = rectangles.filter((rect) => rect !== selectedRectangle);
    setRectangles(updatedRectangles);
    setSelectedRectangle(null);

    // Reconstruir el árbol
    const newTree = new RTreeNode();
    updatedRectangles.forEach((rect) => newTree.insert(rect));
    setTree(newTree);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const results = [];
    tree.search(searchArea, results);
    setSearchResults(results);
  };

  const renderTree = (node, level = 0) => {
    if (!node) return null;

    const elements = [];

    // Colores para diferentes niveles
    const colors = ['red', 'orange', 'green', 'purple', 'blue'];
    const color = colors[level % colors.length];

    // Dibujar el bounding box del nodo
    if (node.boundingBox) {
      elements.push(
        <g key={`node-${level}-${node.boundingBox.x}-${node.boundingBox.y}-${node.boundingBox.width}-${node.boundingBox.height}`}>
          <rect
            x={node.boundingBox.x}
            y={node.boundingBox.y}
            width={node.boundingBox.width}
            height={node.boundingBox.height}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeDasharray={node.leaf ? "none" : "5,5"}
          />
        </g>
      );
    }

    if (node.leaf) {
      // Dibujar los rectángulos (hojas)
      node.children.forEach((rect) => {
        const isSelected = selectedRectangle === rect;
        const isHighlighted = searchResults.includes(rect);

        elements.push(
          <rect
            key={`rect-${rect.x}-${rect.y}-${rect.width}-${rect.height}`}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            fill={isSelected ? 'blue' : isHighlighted ? 'rgba(0, 255, 0, 0.3)' : 'lightblue'}
            stroke="black"
            strokeWidth={1}
            onClick={() => setSelectedRectangle(rect)}
          />
        );
      });
    } else {
      // Recursivamente dibujar los hijos
      node.children.forEach((childNode) => {
        elements.push(...renderTree(childNode, level + 1));
      });
    }

    return elements;
  };

  const convertRTreeToTreeData = (node) => {
    if (!node) return null;
  
    const children = node.children.map((child) => {
      if (child instanceof RTreeNode) {
        // Nodo interno
        return convertRTreeToTreeData(child);
      } else {
        // Rectángulo hoja
        return {
          name: `Rect (${child.x.toFixed(1)}, ${child.y.toFixed(1)})`,
          attributes: {
            x: child.x.toFixed(1),
            y: child.y.toFixed(1),
            width: child.width.toFixed(1),
            height: child.height.toFixed(1),
          },
        };
      }
    });
  
    const boundingBox = node.boundingBox
      ? `(${node.boundingBox.x.toFixed(1)}, ${node.boundingBox.y.toFixed(1)}, ${node.boundingBox.width.toFixed(1)}, ${node.boundingBox.height.toFixed(1)})`
      : 'No definido';
  
    return {
      name: `Nivel ${node.level}`,
      children,
      attributes: {
        boundingBox,
      },
    };
  };
  

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ width: '50%' }}>
        {/* Controles e interacción */}
        <h2>Visualizador de R-Tree</h2>
        <div style={{ marginBottom: '10px' }}>
          <button onClick={addRectangle}>Agregar Rectángulo</button>
          <button onClick={removeRectangle} disabled={!selectedRectangle}>
            Eliminar Seleccionado
          </button>
          {selectedRectangle && (
            <span>
              Rectángulo Seleccionado: ({selectedRectangle.x.toFixed(2)}, {selectedRectangle.y.toFixed(2)})
            </span>
          )}
        </div>

        <form onSubmit={handleSearch} style={{ marginBottom: '10px' }}>
          <h3>Buscar Área</h3>
          <input
            type="number"
            value={searchArea.x}
            onChange={(e) => setSearchArea({ ...searchArea, x: parseFloat(e.target.value) })}
            placeholder="X"
            required
          />
          <input
            type="number"
            value={searchArea.y}
            onChange={(e) => setSearchArea({ ...searchArea, y: parseFloat(e.target.value) })}
            placeholder="Y"
            required
          />
          <input
            type="number"
            value={searchArea.width}
            onChange={(e) => setSearchArea({ ...searchArea, width: parseFloat(e.target.value) })}
            placeholder="Ancho"
            required
          />
          <input
            type="number"
            value={searchArea.height}
            onChange={(e) => setSearchArea({ ...searchArea, height: parseFloat(e.target.value) })}
            placeholder="Alto"
            required
          />
          <button type="submit">Buscar</button>
        </form>

        {/* Visualización de rectángulos y bounding boxes */}
        <svg width="500" height="500" style={{ border: '1px solid black' }}>
          {renderTree(tree)}
          {/* Dibujar el área de búsqueda */}
          <rect
            x={searchArea.x}
            y={searchArea.y}
            width={searchArea.width}
            height={searchArea.height}
            fill="none"
            stroke="green"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        </svg>
      </div>
      <div style={{ width: '50%', height: '500px', overflow: 'auto' }}>
        <h2>Estructura del Árbol</h2>
        <Tree
          data={convertRTreeToTreeData(tree)}
          orientation="vertical"
          translate={{ x: 250, y: 50 }}
          nodeSize={{ x: 200, y: 100 }}
          styles={{
            nodes: {
              node: {
                circle: {
                  fill: 'lightblue',
                },
                name: {
                  stroke: 'black',
                  strokeWidth: 0.5,
                },
                attributes: {
                  stroke: 'black',
                  strokeWidth: 0.5,
                },
              },
              leafNode: {
                circle: {
                  fill: 'lightgreen',
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default RTreeVisualizer;
