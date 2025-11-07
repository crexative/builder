// ========== CONSTANTS ==========
const GRID_WIDTH = 50;   // 1 unidad de ancho
const GRID_HEIGHT = 60;  // 1.2 unidades de alto (proporción 1:1.2)
const DEFAULT_COLOR = '#00FFD1';
const SHAPE_SIZES = {
    module: { width: 50, height: 60 }, // Proporción 1:1.2
    connector: { width: 50, height: 60 },
    'connector-circle': { width: 30, height: 30 },
    'connector-line': { width: 50, height: 50 }
};

// ========== STATE MANAGEMENT ==========
const state = {
    selectedType: 'module',
    selectedColor: DEFAULT_COLOR,
    width: 50,
    height: 60,
    radius: 5,
    opacity: 100,
    padding: 0,
    selectedElement: null,
    selectedElements: [],
    elements: [],
    groups: [],
    snapToGrid: true,
    gridWidth: GRID_WIDTH,
    gridHeight: GRID_HEIGHT,
    isMultiSelect: false,
    // Connection state
    connections: [],
    connectionMode: false,
    firstElement: null,
    connectionThickness: 5,
    connectionColor: DEFAULT_COLOR
};

// ========== DOM REFERENCES ==========
let DOM = {};

// Initialize DOM references after page load
function initDOM() {
    DOM = {
        canvas: document.getElementById('canvas'),
        canvasWrapper: document.querySelector('.canvas-wrapper'),
        snapGuide: document.getElementById('snapGuide'),
        alignGuideV: document.getElementById('alignGuideV'),
        alignGuideH: document.getElementById('alignGuideH'),
        distanceIndicator: document.getElementById('distanceIndicator'),
        connectionsLayer: document.getElementById('connectionsLayer'),
        sliders: {
            width: document.getElementById('widthSlider'),
            height: document.getElementById('heightSlider'),
            radius: document.getElementById('radiusSlider'),
            opacity: document.getElementById('opacitySlider'),
            padding: document.getElementById('paddingSlider'),
            connectionThickness: document.getElementById('connectionThicknessSlider')
        },
        values: {
            width: document.getElementById('widthValue'),
            height: document.getElementById('heightValue'),
            radius: document.getElementById('radiusValue'),
            opacity: document.getElementById('opacityValue'),
            padding: document.getElementById('paddingValue'),
            connectionThickness: document.getElementById('connectionThicknessValue')
        },
        elementCount: document.getElementById('elementCount'),
        gridBg: document.getElementById('gridBg'),
        connectionToggle: document.getElementById('connectionToggle'),
        deleteAllConnections: document.getElementById('deleteAllConnections'),
        // Modal elements
        modalOverlay: document.getElementById('modalOverlay'),
        modalTitle: document.getElementById('modalTitle'),
        modalBody: document.getElementById('modalBody'),
        modalFooter: document.getElementById('modalFooter'),
        modalClose: document.getElementById('modalClose'),
        modalCancel: document.getElementById('modalCancel'),
        modalConfirm: document.getElementById('modalConfirm')
    };
}

// ========== UTILITY FUNCTIONS ==========
const Utils = {
    // Get canvas-relative coordinates
    getCanvasCoords(clientX, clientY) {
        const rect = DOM.canvas.getBoundingClientRect();
        return {
            x: Math.round(clientX - rect.left),
            y: Math.round(clientY - rect.top)
        };
    },

    // Snap position to grid (horizontal) - align to grid cell, not center
    snapToGridX(pos, elementWidth) {
        const gridPos = Math.floor(pos / GRID_WIDTH) * GRID_WIDTH;
        return gridPos; // Align to grid, don't center
    },

    // Snap position to grid (vertical) - align to grid cell, not center
    snapToGridY(pos, elementHeight) {
        const gridPos = Math.floor(pos / GRID_HEIGHT) * GRID_HEIGHT;
        return gridPos; // Align to grid, don't center
    },

    // Round to grid for dragging (horizontal)
    roundToGridX(pos) {
        return Math.round(pos / GRID_WIDTH) * GRID_WIDTH;
    },

    // Round to grid for dragging (vertical)
    roundToGridY(pos) {
        return Math.round(pos / GRID_HEIGHT) * GRID_HEIGHT;
    },

    // Create a shape at specific grid position
    gridPos(row, col) {
        return {
            x: col * GRID_WIDTH,
            y: row * GRID_HEIGHT
        };
    },

    // Update UI value display
    updateValueDisplay(element, value, unit = 'px') {
        element.textContent = value + unit;
    }
};

// ========== MODAL MANAGER ==========
const ModalManager = {
    // Show alert modal
    showAlert(title, message) {
        return new Promise((resolve) => {
            DOM.modalTitle.textContent = title;
            DOM.modalBody.textContent = message;
            DOM.modalFooter.style.display = 'flex';
            DOM.modalCancel.style.display = 'none';
            DOM.modalConfirm.textContent = 'Aceptar';

            DOM.modalOverlay.classList.add('active');

            const handleConfirm = () => {
                this.closeModal();
                resolve(true);
            };

            const handleClose = () => {
                this.closeModal();
                resolve(false);
            };

            DOM.modalConfirm.onclick = handleConfirm;
            DOM.modalClose.onclick = handleClose;
            DOM.modalOverlay.onclick = (e) => {
                if (e.target === DOM.modalOverlay) handleClose();
            };
        });
    },

    // Show confirm modal
    showConfirm(title, message) {
        return new Promise((resolve) => {
            DOM.modalTitle.textContent = title;
            DOM.modalBody.textContent = message;
            DOM.modalFooter.style.display = 'flex';
            DOM.modalCancel.style.display = 'block';
            DOM.modalConfirm.textContent = 'Confirmar';

            DOM.modalOverlay.classList.add('active');

            const handleConfirm = () => {
                this.closeModal();
                resolve(true);
            };

            const handleCancel = () => {
                this.closeModal();
                resolve(false);
            };

            DOM.modalConfirm.onclick = handleConfirm;
            DOM.modalCancel.onclick = handleCancel;
            DOM.modalClose.onclick = handleCancel;
            DOM.modalOverlay.onclick = (e) => {
                if (e.target === DOM.modalOverlay) handleCancel();
            };
        });
    },

    // Show info modal (no buttons needed)
    showInfo(title, message) {
        return new Promise((resolve) => {
            DOM.modalTitle.textContent = title;
            DOM.modalBody.innerHTML = message; // Use innerHTML for formatted content
            DOM.modalFooter.style.display = 'none';

            DOM.modalOverlay.classList.add('active');

            const handleClose = () => {
                this.closeModal();
                resolve(true);
            };

            DOM.modalClose.onclick = handleClose;
            DOM.modalOverlay.onclick = (e) => {
                if (e.target === DOM.modalOverlay) handleClose();
            };
        });
    },

    // Close modal
    closeModal() {
        DOM.modalOverlay.classList.remove('active');
        // Clear event listeners
        DOM.modalConfirm.onclick = null;
        DOM.modalCancel.onclick = null;
        DOM.modalClose.onclick = null;
        DOM.modalOverlay.onclick = null;
    }
};

// ========== PATTERN DEFINITIONS ==========
const PATTERNS = {
    pattern1: [{row: 0, col: 0, type: 'module'}, {row: 1, col: 0, type: 'module'}],
    pattern2: [{row: 0, col: 1, type: 'module'}, {row: 1, col: 0, type: 'module'}, {row: 1, col: 1, type: 'connector'}, {row: 1, col: 2, type: 'module'}],
    pattern3: [{row: 0, col: 1, type: 'module'}, {row: 1, col: 0, type: 'module'}, {row: 1, col: 1, type: 'connector'}, {row: 1, col: 2, type: 'module'}, {row: 2, col: 1, type: 'module'}],
    pattern4: [{row: 0, col: 1, type: 'module'}, {row: 1, col: 0, type: 'module'}, {row: 1, col: 2, type: 'module'}, {row: 2, col: 1, type: 'module'}],
    pattern5: [{row: 0, col: 0, type: 'module'}, {row: 1, col: 1, type: 'module'}, {row: 0, col: 2, type: 'module'}],
    pattern6: [{row: 0, col: 0, type: 'module'}, {row: 1, col: 1, type: 'module'}, {row: 2, col: 2, type: 'module'}],
    pattern7: [{row: 0, col: 0, type: 'module'}, {row: 1, col: 1, type: 'module'}, {row: 0, col: 2, type: 'module'}],
    pattern8: [{row: 0, col: 2, type: 'module'}, {row: 1, col: 1, type: 'module'}, {row: 2, col: 0, type: 'module'}],
    pattern9: [{row: 0, col: 0, type: 'module'}, {row: 0, col: 1, type: 'module'}, {row: 1, col: 1, type: 'module'}, {row: 1, col: 2, type: 'module'}],
    pattern10: [{row: 0, col: 1, type: 'module'}, {row: 1, col: 2, type: 'module'}, {row: 2, col: 1, type: 'module'}, {row: 3, col: 1, type: 'connector-circle'}]
};

const LOGOS = {
    main: [{row: 0, col: 1, type: 'module'}, {row: 1, col: 0, type: 'module'}, {row: 1, col: 1, type: 'connector'}, {row: 1, col: 2, type: 'module'}, {row: 2, col: 1, type: 'module'}],
    mascota: [{row: 0, col: 1, type: 'module'}, {row: 1, col: 0, type: 'module'}, {row: 1, col: 1, type: 'connector'}, {row: 1, col: 2, type: 'module'}, {row: 2, col: 1, type: 'module'}],
    mini: [{row: 0, col: 1, type: 'connector-circle'}, {row: 1, col: 0, type: 'connector-circle'}, {row: 1, col: 1, type: 'connector'}, {row: 1, col: 2, type: 'connector-circle'}, {row: 2, col: 1, type: 'connector-circle'}]
};

// ========== SHAPE FACTORY ==========
const ShapeFactory = {
    // Create star path string (DRY - reused everywhere)
    createStarPath(cx, cy, outerRadius) {
        const innerRadius = outerRadius * 0.20; // 20% for optimal concave curves
        return `
            M ${cx},${cy - outerRadius}
            C ${cx + innerRadius},${cy - innerRadius} ${cx + innerRadius},${cy - innerRadius} ${cx + outerRadius},${cy}
            C ${cx + innerRadius},${cy + innerRadius} ${cx + innerRadius},${cy + innerRadius} ${cx},${cy + outerRadius}
            C ${cx - innerRadius},${cy + innerRadius} ${cx - innerRadius},${cy + innerRadius} ${cx - outerRadius},${cy}
            C ${cx - innerRadius},${cy - innerRadius} ${cx - innerRadius},${cy - innerRadius} ${cx},${cy - outerRadius}
            Z
        `;
    },

    createConnectorInner(color, width, height) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none';

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', this.createStarPath(50, 50, 45));
        path.setAttribute('fill', color);
        svg.appendChild(path);

        return svg;
    },

    getBorderRadius(type, height) {
        const radiusMap = {
            'connector-circle': '50%',
            'connector-line': `${height / 2}px`,
            'connector': '0px', // SVG shape, no border-radius
            'module': `${state.radius}px`
        };
        return radiusMap[type] || `${state.radius}px`;
    },

    createDeleteButton(element) {
        const btn = document.createElement('button');
        btn.className = 'delete-btn';
        btn.innerHTML = '×';
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            ShapeFactory.deleteElement(element);
        });
        return btn;
    },

    createInfo(width, height) {
        const info = document.createElement('div');
        info.className = 'element-info';
        info.textContent = `${width}×${height}px`;
        return info;
    },

    deleteElement(element) {
        // Delete all connections associated with this element
        ConnectionManager.deleteElementConnections(element);

        if (element.parentNode === DOM.canvas) {
            DOM.canvas.removeChild(element);
        }
        state.elements = state.elements.filter(el => el !== element);
        state.selectedElements = state.selectedElements.filter(el => el !== element);
        updateElementCount();
        if (state.selectedElement === element) {
            state.selectedElement = null;
        }
    }
};

// ========== PATTERN BUILDER ==========
const PatternBuilder = {
    build(patternDef, startX = 200, startY = 200, shouldGroup = false) {
        const elements = [];
        patternDef.forEach(({row, col, type}) => {
            const pos = Utils.gridPos(row, col);
            const el = createElement(startX + pos.x, startY + pos.y, type);
            elements.push(el);
        });
        if (shouldGroup && elements.length > 1) {
            GroupManager.createGroup(elements);
        }
        return elements;
    },

    createLogo(logoType, startX, startY) {
        const logoDef = LOGOS[logoType];
        return this.build(logoDef, startX, startY, false);
    }
};

// ========== ALIGNMENT HELPER ==========
const AlignmentHelper = {
    findNearbyElements(draggedElement) {
        const threshold = Math.max(GRID_WIDTH, GRID_HEIGHT) * 1.5;
        const draggedX = draggedElement.offsetLeft;
        const draggedY = draggedElement.offsetTop;
        const draggedCenterX = draggedX + parseInt(draggedElement.style.width) / 2;
        const draggedCenterY = draggedY + parseInt(draggedElement.style.height) / 2;
        const nearby = [];

        state.elements.forEach(el => {
            if (el === draggedElement) return;
            const elX = el.offsetLeft;
            const elY = el.offsetTop;
            const elCenterX = elX + parseInt(el.style.width) / 2;
            const elCenterY = elY + parseInt(el.style.height) / 2;
            const distX = Math.abs(draggedCenterX - elCenterX);
            const distY = Math.abs(draggedCenterY - elCenterY);

            if (distX < threshold || distY < threshold) {
                nearby.push({element: el, x: elX, y: elY, centerX: elCenterX, centerY: elCenterY, distX, distY});
            }
        });
        return nearby;
    },

    showGuides(draggedElement) {
        const nearby = this.findNearbyElements(draggedElement);
        const draggedX = draggedElement.offsetLeft;
        const draggedY = draggedElement.offsetTop;
        const draggedCenterX = draggedX + parseInt(draggedElement.style.width) / 2;
        const draggedCenterY = draggedY + parseInt(draggedElement.style.height) / 2;

        let showV = false, showH = false, closestX = null, closestY = null;

        nearby.forEach(item => {
            if (Math.abs(draggedCenterX - item.centerX) < GRID_WIDTH / 2) {
                showV = true;
                if (!closestX || Math.abs(draggedCenterX - item.centerX) < Math.abs(draggedCenterX - closestX)) {
                    closestX = item.centerX;
                }
            }
            if (Math.abs(draggedCenterY - item.centerY) < GRID_HEIGHT / 2) {
                showH = true;
                if (!closestY || Math.abs(draggedCenterY - item.centerY) < Math.abs(draggedCenterY - closestY)) {
                    closestY = item.centerY;
                }
            }
        });

        if (showV && closestX !== null) {
            DOM.alignGuideV.style.left = closestX + 'px';
            DOM.alignGuideV.classList.add('active');
        } else {
            DOM.alignGuideV.classList.remove('active');
        }

        if (showH && closestY !== null) {
            DOM.alignGuideH.style.top = closestY + 'px';
            DOM.alignGuideH.classList.add('active');
        } else {
            DOM.alignGuideH.classList.remove('active');
        }

        if (nearby.length > 0) {
            const nearest = nearby.reduce((a, b) => {
                const distA = Math.min(a.distX, a.distY);
                const distB = Math.min(b.distX, b.distY);
                return distA < distB ? a : b;
            });
            const minDist = Math.min(nearest.distX, nearest.distY);
            // Calculate grid distance (average of X and Y grid sizes)
            const avgGridSize = (GRID_WIDTH + GRID_HEIGHT) / 2;
            const distance = Math.round(minDist / avgGridSize * 100) / 100;
            DOM.distanceIndicator.textContent = `${distance.toFixed(1)} grid`;
            DOM.distanceIndicator.style.left = (draggedCenterX + 20) + 'px';
            DOM.distanceIndicator.style.top = (draggedCenterY - 20) + 'px';
            DOM.distanceIndicator.classList.add('active');
        } else {
            DOM.distanceIndicator.classList.remove('active');
        }
    },

    hideGuides() {
        DOM.alignGuideV.classList.remove('active');
        DOM.alignGuideH.classList.remove('active');
        DOM.distanceIndicator.classList.remove('active');
    }
};

// ========== GROUP MANAGER ==========
const GroupManager = {
    createGroup(elements) {
        const groupId = `group-${Date.now()}`;
        const group = {id: groupId, elements: elements};
        elements.forEach(el => {
            el.dataset.groupId = groupId;
            el.classList.add('grouped');
        });
        state.groups.push(group);
        return group;
    },

    ungroup(groupId) {
        const group = state.groups.find(g => g.id === groupId);
        if (!group) return;
        group.elements.forEach(el => {
            delete el.dataset.groupId;
            el.classList.remove('grouped');
        });
        state.groups = state.groups.filter(g => g.id !== groupId);
    },

    getGroup(element) {
        return state.groups.find(g => g.id === element.dataset.groupId);
    }
};

// ========== CONNECTION MANAGER ==========
const ConnectionManager = {
    // Get center coordinates of an element
    getElementCenter(element) {
        const x = parseInt(element.style.left);
        const y = parseInt(element.style.top);
        const w = parseInt(element.style.width);
        const h = parseInt(element.style.height);
        return {
            x: x + w / 2,
            y: y + h / 2
        };
    },

    // Calculate edge point on rectangle border given direction to another point
    getEdgePoint(element, targetX, targetY) {
        const x = parseInt(element.style.left);
        const y = parseInt(element.style.top);
        const w = parseInt(element.style.width);
        const h = parseInt(element.style.height);
        const cx = x + w / 2;
        const cy = y + h / 2;

        // Calculate angle from center to target
        const dx = targetX - cx;
        const dy = targetY - cy;

        // If elements are at same position, return center
        if (dx === 0 && dy === 0) {
            return { x: cx, y: cy };
        }

        // Calculate intersection with rectangle border
        // We need to find which edge of the rectangle the line intersects
        const angle = Math.atan2(dy, dx);

        // Half dimensions
        const hw = w / 2;
        const hh = h / 2;

        // Calculate intersection point
        let edgeX, edgeY;

        // Determine which edge based on angle
        const tanAngle = Math.abs(dy / dx);
        const rectRatio = hh / hw;

        if (tanAngle < rectRatio) {
            // Intersects left or right edge
            if (dx > 0) {
                // Right edge
                edgeX = cx + hw;
                edgeY = cy + (hw * dy / dx);
            } else {
                // Left edge
                edgeX = cx - hw;
                edgeY = cy - (hw * dy / dx);
            }
        } else {
            // Intersects top or bottom edge
            if (dy > 0) {
                // Bottom edge
                edgeX = cx + (hh * dx / dy);
                edgeY = cy + hh;
            } else {
                // Top edge
                edgeX = cx - (hh * dx / dy);
                edgeY = cy - hh;
            }
        }

        return { x: edgeX, y: edgeY };
    },

    // Create a new connection between two elements
    createConnection(fromElement, toElement) {
        const connectionId = `conn-${Date.now()}`;
        const connection = {
            id: connectionId,
            from: fromElement,
            to: toElement,
            color: state.connectionColor,
            thickness: state.connectionThickness,
            lineElement: null
        };

        // Store reference in element dataset for easy cleanup
        if (!fromElement.dataset.connections) {
            fromElement.dataset.connections = connectionId;
        } else {
            fromElement.dataset.connections += ',' + connectionId;
        }
        if (!toElement.dataset.connections) {
            toElement.dataset.connections = connectionId;
        } else {
            toElement.dataset.connections += ',' + connectionId;
        }

        state.connections.push(connection);
        this.renderConnection(connection);
        return connection;
    },


    // Render a connection as an SVG line with star endpoints
    renderConnection(connection) {
        // Get centers first to determine direction
        const fromCenter = this.getElementCenter(connection.from);
        const toCenter = this.getElementCenter(connection.to);

        // Calculate edge points (border to border)
        const fromEdge = this.getEdgePoint(connection.from, toCenter.x, toCenter.y);
        const toEdge = this.getEdgePoint(connection.to, fromCenter.x, fromCenter.y);

        // Create a group for the connection
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.dataset.connectionId = connection.id;
        group.classList.add('connection-line');

        // Create the main line (border to border)
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromEdge.x);
        line.setAttribute('y1', fromEdge.y);
        line.setAttribute('x2', toEdge.x);
        line.setAttribute('y2', toEdge.y);
        line.setAttribute('stroke', connection.color);
        line.setAttribute('stroke-width', connection.thickness);
        line.setAttribute('stroke-linecap', 'round');

        // Create star shapes at endpoints
        const starSize = connection.thickness * 2.5;

        const starFrom = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        starFrom.setAttribute('d', ShapeFactory.createStarPath(fromEdge.x, fromEdge.y, starSize / 2));
        starFrom.setAttribute('fill', connection.color);
        starFrom.classList.add('connection-star');

        const starTo = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        starTo.setAttribute('d', ShapeFactory.createStarPath(toEdge.x, toEdge.y, starSize / 2));
        starTo.setAttribute('fill', connection.color);
        starTo.classList.add('connection-star');

        // Add all elements to group
        group.appendChild(line);
        group.appendChild(starFrom);
        group.appendChild(starTo);

        // Add click handler to select/delete connection
        group.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectConnection(connection);
        });

        DOM.connectionsLayer.appendChild(group);
        connection.lineElement = group;
        connection.line = line;
        connection.starFrom = starFrom;
        connection.starTo = starTo;
    },

    // Update a specific connection's visual representation
    updateConnection(connection) {
        if (!connection.line) return;

        // Get centers first to determine direction
        const fromCenter = this.getElementCenter(connection.from);
        const toCenter = this.getElementCenter(connection.to);

        // Calculate edge points (border to border)
        const fromEdge = this.getEdgePoint(connection.from, toCenter.x, toCenter.y);
        const toEdge = this.getEdgePoint(connection.to, fromCenter.x, fromCenter.y);

        // Update line
        connection.line.setAttribute('x1', fromEdge.x);
        connection.line.setAttribute('y1', fromEdge.y);
        connection.line.setAttribute('x2', toEdge.x);
        connection.line.setAttribute('y2', toEdge.y);

        // Update star positions
        const starSize = connection.thickness * 2.5;
        connection.starFrom.setAttribute('d', ShapeFactory.createStarPath(fromEdge.x, fromEdge.y, starSize / 2));
        connection.starTo.setAttribute('d', ShapeFactory.createStarPath(toEdge.x, toEdge.y, starSize / 2));
    },

    // Update all connections (called when elements are moved)
    updateAllConnections() {
        state.connections.forEach(conn => {
            this.updateConnection(conn);
        });
    },

    // Delete a specific connection
    deleteConnection(connectionId) {
        const connection = state.connections.find(c => c.id === connectionId);
        if (!connection) return;

        // Remove line from SVG
        if (connection.lineElement && connection.lineElement.parentNode) {
            connection.lineElement.parentNode.removeChild(connection.lineElement);
        }

        // Remove from element datasets
        [connection.from, connection.to].forEach(el => {
            if (el && el.dataset.connections) {
                const conns = el.dataset.connections.split(',').filter(id => id !== connectionId);
                if (conns.length > 0) {
                    el.dataset.connections = conns.join(',');
                } else {
                    delete el.dataset.connections;
                }
            }
        });

        // Remove from state
        state.connections = state.connections.filter(c => c.id !== connectionId);
    },

    // Delete all connections for a specific element
    deleteElementConnections(element) {
        if (!element.dataset.connections) return;
        const connectionIds = element.dataset.connections.split(',');
        connectionIds.forEach(id => this.deleteConnection(id));
    },

    // Delete all connections
    deleteAllConnections() {
        const connectionsToDelete = [...state.connections];
        connectionsToDelete.forEach(conn => {
            this.deleteConnection(conn.id);
        });
    },

    // Select a connection (for future editing)
    selectConnection(connection) {
        // Deselect all connections
        state.connections.forEach(conn => {
            if (conn.lineElement) {
                conn.lineElement.classList.remove('selected');
            }
        });

        // Select this connection
        if (connection.lineElement) {
            connection.lineElement.classList.add('selected');
        }
    },

    // Handle element click in connection mode
    handleElementClick(element) {
        if (!state.connectionMode) return false;

        if (!state.firstElement) {
            // First element selected
            state.firstElement = element;
            element.classList.add('connection-pending');
            return true;
        } else {
            // Second element selected - create connection
            if (state.firstElement !== element) {
                this.createConnection(state.firstElement, element);
            }
            state.firstElement.classList.remove('connection-pending');
            state.firstElement = null;
            return true;
        }
    },

    // Toggle connection mode
    toggleConnectionMode() {
        state.connectionMode = !state.connectionMode;
        if (!state.connectionMode && state.firstElement) {
            state.firstElement.classList.remove('connection-pending');
            state.firstElement = null;
        }
        return state.connectionMode;
    }
};

// ========== ELEMENT CREATION ==========
function createElement(x, y, type = null) {
    const shapeType = type || state.selectedType;
    const sizeObj = SHAPE_SIZES[shapeType] || { width: 50, height: 60 };
    // Always use the shape's default size, not state.width/height
    // state.width/height are for editing selected elements
    const width = sizeObj.width;
    const height = sizeObj.height;

    const element = document.createElement('div');
    element.className = 'element ' + shapeType;

    // Snap to grid
    const snappedX = Utils.snapToGridX(x, width);
    const snappedY = Utils.snapToGridY(y, height);

    // Set base styles
    Object.assign(element.style, {
        left: `${snappedX}px`,
        top: `${snappedY}px`,
        width: `${width}px`,
        height: `${height}px`,
        opacity: state.opacity / 100,
        background: shapeType === 'connector' ? 'transparent' : state.selectedColor,
        borderRadius: ShapeFactory.getBorderRadius(shapeType, height)
    });

    // Add connector SVG or padding
    if (shapeType === 'connector') {
        element.appendChild(ShapeFactory.createConnectorInner(state.selectedColor, width, height));
    } else if (state.padding > 0) {
        element.style.boxShadow = `inset 0 0 0 ${state.padding}px #0A0F1A`;
    }
    element.appendChild(ShapeFactory.createDeleteButton(element));
    element.appendChild(ShapeFactory.createInfo(width, height));

    element.addEventListener('click', (e) => {
        e.stopPropagation();

        // Check if we're in connection mode
        if (ConnectionManager.handleElementClick(element)) {
            return; // Connection mode handled the click
        }

        if (e.ctrlKey || e.metaKey) {
            toggleElementSelection(element);
        } else {
            selectElement(element);
        }
    });

    makeDraggable(element);
    DOM.canvas.appendChild(element);
    state.elements.push(element);
    updateElementCount();

    return element;
}

// ========== SELECTION MANAGEMENT ==========
function toggleElementSelection(element) {
    const index = state.selectedElements.indexOf(element);
    if (index > -1) {
        state.selectedElements.splice(index, 1);
        element.classList.remove('selected');
    } else {
        state.selectedElements.push(element);
        element.classList.add('selected');
    }
    state.selectedElement = state.selectedElements[state.selectedElements.length - 1] || null;
}

function selectElement(element) {
    if (state.selectedElement) {
        state.selectedElement.classList.remove('selected');
    }
    state.selectedElement = element;
    element.classList.add('selected');

    const computedStyle = window.getComputedStyle(element);
    state.width = parseInt(element.style.width);
    state.height = parseInt(element.style.height);
    state.radius = parseInt(element.style.borderRadius) || 0;
    state.opacity = Math.round(parseFloat(element.style.opacity) * 100);

    const boxShadow = element.style.boxShadow;
    if (boxShadow && boxShadow.includes('inset')) {
        const match = boxShadow.match(/inset 0 0 0 (\d+)px/);
        state.padding = match ? parseInt(match[1]) : 0;
    } else {
        state.padding = 0;
    }

    // Update selected color from the element
    if (element.classList.contains('connector')) {
        const svgPath = element.querySelector('svg path');
        if (svgPath) {
            state.selectedColor = svgPath.getAttribute('fill');
        }
    } else {
        state.selectedColor = element.style.background || DEFAULT_COLOR;
    }

    DOM.sliders.width.value = state.width;
    DOM.sliders.height.value = state.height;
    DOM.sliders.radius.value = state.radius;
    DOM.sliders.opacity.value = state.opacity;
    DOM.sliders.padding.value = state.padding;

    DOM.values.width.textContent = state.width + 'px';
    DOM.values.height.textContent = state.height + 'px';
    DOM.values.radius.textContent = state.radius + 'px';
    DOM.values.opacity.textContent = state.opacity + '%';
    DOM.values.padding.textContent = state.padding + 'px';
}

// ========== DRAGGABLE ==========
function makeDraggable(element) {
    let isDragging = false;
    let startX, startY;
    let initialPositions = new Map();

    element.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('delete-btn')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        const groupId = element.dataset.groupId;
        if (groupId) {
            const group = GroupManager.getGroup(element);
            if (group) {
                group.elements.forEach(el => {
                    initialPositions.set(el, {x: el.offsetLeft, y: el.offsetTop});
                    el.style.cursor = 'grabbing';
                });
            }
        } else {
            initialPositions.set(element, {x: element.offsetLeft, y: element.offsetTop});
            element.style.cursor = 'grabbing';
        }

        e.preventDefault();
        DOM.snapGuide.classList.add('active');
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const groupId = element.dataset.groupId;

        if (groupId) {
            const group = GroupManager.getGroup(element);
            if (group) {
                group.elements.forEach(el => {
                    const initial = initialPositions.get(el);
                    const newX = initial.x + dx;
                    const newY = initial.y + dy;
                    const gridX = Utils.roundToGridX(newX);
                    const gridY = Utils.roundToGridY(newY);
                    el.style.left = gridX + 'px';
                    el.style.top = gridY + 'px';
                });

                const newX = initialPositions.get(element).x + dx;
                const newY = initialPositions.get(element).y + dy;
                const gridX = Utils.roundToGridX(newX);
                const gridY = Utils.roundToGridY(newY);
                DOM.snapGuide.style.left = gridX + 'px';
                DOM.snapGuide.style.top = gridY + 'px';
            }
        } else {
            const initial = initialPositions.get(element);
            const newX = initial.x + dx;
            const newY = initial.y + dy;
            const gridX = Utils.roundToGridX(newX);
            const gridY = Utils.roundToGridY(newY);
            element.style.left = gridX + 'px';
            element.style.top = gridY + 'px';
            DOM.snapGuide.style.left = gridX + 'px';
            DOM.snapGuide.style.top = gridY + 'px';
        }

        AlignmentHelper.showGuides(element);
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            initialPositions.forEach((pos, el) => {
                el.style.cursor = 'move';
            });
            initialPositions.clear();
            DOM.snapGuide.classList.remove('active');
            AlignmentHelper.hideGuides();

            // Update all connections after dragging
            ConnectionManager.updateAllConnections();
        }
    });
}

function updateElementCount() {
    DOM.elementCount.textContent = `Elementos: ${state.elements.length}`;
}

// ========== EVENT HANDLERS ==========
function initEventHandlers() {
    // Shape buttons
    document.querySelectorAll('.shape-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            state.selectedType = this.dataset.type;
            const sizeObj = SHAPE_SIZES[this.dataset.type] || { width: 50, height: 60 };
            state.width = sizeObj.width;
            state.height = sizeObj.height;
            DOM.sliders.width.value = sizeObj.width;
            DOM.sliders.height.value = sizeObj.height;
            DOM.values.width.textContent = sizeObj.width + 'px';
            DOM.values.height.textContent = sizeObj.height + 'px';
        });
    });

    // Color options
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.addEventListener('click', function() {
            document.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            state.selectedColor = this.dataset.color;
            if (state.selectedElement) {
                if (state.selectedElement.classList.contains('connector')) {
                    // Update SVG path fill color
                    const svgPath = state.selectedElement.querySelector('svg path');
                    if (svgPath) {
                        svgPath.setAttribute('fill', state.selectedColor);
                    }
                } else {
                    state.selectedElement.style.background = state.selectedColor;
                }
            }
        });
    });

    // Sliders
    DOM.sliders.width.addEventListener('input', (e) => {
        state.width = e.target.value;
        DOM.values.width.textContent = e.target.value + 'px';
        if (state.selectedElement) {
            state.selectedElement.style.width = state.width + 'px';
        }
    });

    DOM.sliders.height.addEventListener('input', (e) => {
        state.height = e.target.value;
        DOM.values.height.textContent = e.target.value + 'px';
        if (state.selectedElement) {
            state.selectedElement.style.height = state.height + 'px';
            if (state.selectedElement.classList.contains('connector-line')) {
                state.selectedElement.style.borderRadius = (state.height / 2) + 'px';
            }
        }
    });

    DOM.sliders.radius.addEventListener('input', (e) => {
        state.radius = e.target.value;
        DOM.values.radius.textContent = e.target.value + 'px';
        if (state.selectedElement) {
            state.selectedElement.style.borderRadius = state.radius + 'px';
        }
    });

    DOM.sliders.opacity.addEventListener('input', (e) => {
        state.opacity = e.target.value;
        DOM.values.opacity.textContent = e.target.value + '%';
        if (state.selectedElement) {
            state.selectedElement.style.opacity = state.opacity / 100;
        }
    });

    DOM.sliders.padding.addEventListener('input', (e) => {
        state.padding = e.target.value;
        DOM.values.padding.textContent = e.target.value + 'px';
        if (state.selectedElement) {
            const padding = parseInt(e.target.value);
            state.selectedElement.style.boxShadow = padding > 0 ? `inset 0 0 0 ${padding}px #0A0F1A` : 'none';
        }
    });

    // Canvas click
    DOM.canvas.addEventListener('click', (e) => {
        if (e.target === DOM.canvas) {
            // Deselect all elements when clicking on canvas
            if (state.selectedElement) {
                state.selectedElement.classList.remove('selected');
                state.selectedElement = null;
            }
            state.selectedElements.forEach(el => el.classList.remove('selected'));
            state.selectedElements = [];

            const coords = Utils.getCanvasCoords(e.clientX, e.clientY);
            createElement(coords.x, coords.y);
        }
    });

    // Pattern buttons (commented out - removed from UI)
    // document.querySelectorAll('.pattern-btn').forEach(btn => {
    //     btn.addEventListener('click', function() {
    //         const patternKey = this.dataset.pattern;
    //         const pattern = PATTERNS[patternKey];
    //         const groupPatternsCheckbox = document.getElementById('groupPatterns');
    //         const shouldGroup = groupPatternsCheckbox ? groupPatternsCheckbox.checked : false;
    //         if (pattern) {
    //             const startX = DOM.canvas.offsetWidth / 2 - 100;
    //             const startY = DOM.canvas.offsetHeight / 2 - 100;
    //             PatternBuilder.build(pattern, startX, startY, shouldGroup);
    //         }
    //     });
    // });

    // Logo buttons (commented out - removed from UI)
    // const logoMain = document.getElementById('logoMain');
    // if (logoMain) {
    //     logoMain.addEventListener('click', () => {
    //         const startX = DOM.canvas.offsetWidth / 2 - 75;
    //         const startY = DOM.canvas.offsetHeight / 2 - 75;
    //         PatternBuilder.createLogo('main', startX, startY);
    //     });
    // }

    // const logoMascota = document.getElementById('logoMascota');
    // if (logoMascota) {
    //     logoMascota.addEventListener('click', () => {
    //         const startX = DOM.canvas.offsetWidth / 2 - 75;
    //         const startY = DOM.canvas.offsetHeight / 2 - 75;
    //         PatternBuilder.createLogo('mascota', startX, startY);
    //     });
    // }

    // const logoMini = document.getElementById('logoMini');
    // if (logoMini) {
    //     logoMini.addEventListener('click', () => {
    //         const startX = DOM.canvas.offsetWidth / 2 - 75;
    //         const startY = DOM.canvas.offsetHeight / 2 - 75;
    //         PatternBuilder.createLogo('mini', startX, startY);
    //     });
    // }

    // Grouping buttons
    document.getElementById('groupSelected').addEventListener('click', async () => {
        if (state.selectedElements.length < 2) {
            await ModalManager.showAlert('Agrupación', 'Selecciona al menos 2 elementos para agrupar (usa Ctrl/Cmd + Click)');
            return;
        }
        GroupManager.createGroup(state.selectedElements);
        await ModalManager.showAlert('Agrupación Exitosa', `${state.selectedElements.length} elementos agrupados correctamente`);
    });

    document.getElementById('ungroupSelected').addEventListener('click', async () => {
        if (!state.selectedElement || !state.selectedElement.dataset.groupId) {
            await ModalManager.showAlert('Desagrupación', 'Selecciona un elemento agrupado para desagrupar');
            return;
        }
        const groupId = state.selectedElement.dataset.groupId;
        GroupManager.ungroup(groupId);
        await ModalManager.showAlert('Desagrupación Exitosa', 'El grupo ha sido desagrupado correctamente');
    });

    // Action buttons
    document.getElementById('addElement').addEventListener('click', () => {
        const x = Math.random() * (DOM.canvas.offsetWidth - 200) + 100;
        const y = Math.random() * (DOM.canvas.offsetHeight - 200) + 100;
        createElement(x, y);
    });

    document.getElementById('clearCanvas').addEventListener('click', async () => {
        if (state.elements.length === 0 && state.connections.length === 0) {
            await ModalManager.showAlert('Canvas Vacío', 'El canvas ya está vacío');
            return;
        }
        const confirmed = await ModalManager.showConfirm('Limpiar Canvas', '¿Seguro que quieres eliminar todos los elementos y conexiones?');
        if (confirmed) {
            // Delete all connections first
            ConnectionManager.deleteAllConnections();

            // Then delete all elements
            const elementsToRemove = [...state.elements];
            elementsToRemove.forEach(el => {
                if (el && el.parentNode === DOM.canvas) {
                    DOM.canvas.removeChild(el);
                }
            });
            state.elements = [];
            state.selectedElement = null;
            updateElementCount();
        }
    });

    document.getElementById('exportSVG').addEventListener('click', () => {
        let svg = `<svg width="${DOM.canvas.offsetWidth}" height="${DOM.canvas.offsetHeight}" xmlns="http://www.w3.org/2000/svg">\n`;
        svg += `  <rect width="100%" height="100%" fill="#0A0F1A"/>\n`;

        // Export connections first (so they appear behind elements)
        state.connections.forEach(conn => {
            // Get centers first to determine direction
            const fromCenter = ConnectionManager.getElementCenter(conn.from);
            const toCenter = ConnectionManager.getElementCenter(conn.to);

            // Calculate edge points (border to border)
            const fromEdge = ConnectionManager.getEdgePoint(conn.from, toCenter.x, toCenter.y);
            const toEdge = ConnectionManager.getEdgePoint(conn.to, fromCenter.x, fromCenter.y);

            const starSize = conn.thickness * 2.5;

            // Export line (border to border)
            svg += `  <line x1="${fromEdge.x}" y1="${fromEdge.y}" x2="${toEdge.x}" y2="${toEdge.y}" stroke="${conn.color}" stroke-width="${conn.thickness}" stroke-linecap="round"/>\n`;

            // Export star at start point
            svg += `  <path d="${ShapeFactory.createStarPath(fromEdge.x, fromEdge.y, starSize / 2)}" fill="${conn.color}"/>\n`;

            // Export star at end point
            svg += `  <path d="${ShapeFactory.createStarPath(toEdge.x, toEdge.y, starSize / 2)}" fill="${conn.color}"/>\n`;
        });

        // Export elements
        state.elements.forEach(el => {
            const x = parseInt(el.style.left);
            const y = parseInt(el.style.top);
            const w = parseInt(el.style.width);
            const h = parseInt(el.style.height);
            const opacity = el.style.opacity;

            if (el.classList.contains('connector')) {
                const svgPath = el.querySelector('svg path');
                if (svgPath) {
                    const color = svgPath.getAttribute('fill');
                    const starPath = ShapeFactory.createStarPath(x + w/2, y + h/2, Math.min(w, h) * 0.45);
                    svg += `  <path d="${starPath}" fill="${color}" opacity="${opacity}"/>\n`;
                }
            } else {
                // Export module as rectangle
                const r = parseInt(el.style.borderRadius) || 0;
                const color = el.style.background;
                svg += `  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${color}" opacity="${opacity}"/>\n`;
            }
        });
        svg += `</svg>`;
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'crexative-design.svg';
        a.click();
    });

    // Grid toggle
    document.getElementById('gridToggle').addEventListener('click', function() {
        this.classList.toggle('active');
        DOM.gridBg.style.display = DOM.gridBg.style.display === 'none' ? 'block' : 'none';
    });

    // Snap toggle
    document.getElementById('snapToggle').addEventListener('click', async function() {
        await ModalManager.showInfo('Snap a Grilla', 'El snap a la grilla está siempre activo para mantener la simetría perfecta de las moléculas y organismos.');
    });

    // Connection mode toggle
    DOM.connectionToggle.addEventListener('click', function() {
        const isActive = ConnectionManager.toggleConnectionMode();
        this.classList.toggle('active', isActive);
        if (isActive) {
            this.style.background = '#00FFD1';
            this.style.color = '#0A0F1A';
        } else {
            this.style.background = '';
            this.style.color = '';
        }
    });

    // Connection thickness slider
    DOM.sliders.connectionThickness.addEventListener('input', (e) => {
        state.connectionThickness = parseInt(e.target.value);
        DOM.values.connectionThickness.textContent = e.target.value + 'px';
    });

    // Delete all connections button
    DOM.deleteAllConnections.addEventListener('click', async () => {
        if (state.connections.length === 0) {
            await ModalManager.showAlert('Sin Conexiones', 'No hay conexiones para eliminar');
            return;
        }
        const confirmed = await ModalManager.showConfirm('Eliminar Conexiones', `¿Seguro que quieres eliminar todas las ${state.connections.length} conexiones?`);
        if (confirmed) {
            ConnectionManager.deleteAllConnections();
            await ModalManager.showAlert('Conexiones Eliminadas', 'Todas las conexiones han sido eliminadas correctamente');
        }
    });

    // Collapsible sections
    document.querySelectorAll('.section-title').forEach(title => {
        title.addEventListener('click', function() {
            this.classList.toggle('collapsed');
            const content = this.nextElementSibling;
            if (content && content.classList.contains('section-content')) {
                content.classList.toggle('collapsed');
            }
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Delete') {
            if (state.selectedElements.length > 0) {
                state.selectedElements.forEach(el => {
                    if (el.parentNode === DOM.canvas) {
                        DOM.canvas.removeChild(el);
                    }
                    state.elements = state.elements.filter(elem => elem !== el);
                });
                state.selectedElements = [];
                state.selectedElement = null;
                updateElementCount();
            } else if (state.selectedElement) {
                ShapeFactory.deleteElement(state.selectedElement);
            }
        }

        if (e.key === 'Escape') {
            state.selectedElements.forEach(el => el.classList.remove('selected'));
            state.selectedElements = [];
            if (state.selectedElement) {
                state.selectedElement.classList.remove('selected');
                state.selectedElement = null;
            }
        }
    });

    // Deselect on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.element') && !e.target.closest('.sidebar')) {
            if (state.selectedElement) {
                state.selectedElement.classList.remove('selected');
                state.selectedElement = null;
            }
        }
    });

    // Canvas mousemove for snap guide preview
    DOM.canvas.addEventListener('mousemove', (e) => {
        const coords = Utils.getCanvasCoords(e.clientX, e.clientY);
        const gridX = Math.floor(coords.x / GRID_WIDTH) * GRID_WIDTH;
        const gridY = Math.floor(coords.y / GRID_HEIGHT) * GRID_HEIGHT;

        // Ensure pixel-perfect positioning
        DOM.snapGuide.style.transform = 'translate3d(0, 0, 0)';
        DOM.snapGuide.style.left = gridX + 'px';
        DOM.snapGuide.style.top = gridY + 'px';
        DOM.snapGuide.classList.add('active');

        // Debug logging (comment out in production)
        // console.log(`Mouse: (${coords.x}, ${coords.y}) → Grid: (${gridX}, ${gridY})`);
    });

    DOM.canvas.addEventListener('mouseleave', () => {
        DOM.snapGuide.classList.remove('active');
    });
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    initDOM();
    initEventHandlers();
    updateElementCount();
});
