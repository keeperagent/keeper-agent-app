import { NODE_TYPE } from "@/electron/constant";

const findIntersectionOfWithCircle = (
  Px: number,
  Py: number,
  Cx: number,
  Cy: number,
  circleRadius: number
): { x: number; y: number } => {
  // Calculate the direction vector from C to point P
  const dx = Px - Cx;
  const dy = Py - Cy;

  // Calculate the magnitude of the direction vector
  const magnitude = Math.sqrt(dx * dx + dy * dy);

  // Normalize the direction vector
  const normalizedDx = dx / magnitude;
  const normalizedDy = dy / magnitude;

  // Calculate the coordinates of point B on the edge of the circle
  const x = Cx + normalizedDx * circleRadius;
  const y = Cy + normalizedDy * circleRadius;

  return { x, y };
};

// this helper function returns the intersection point
// of the line between the center of the intersectionNode and the target node
const getNodeIntersection = (intersectionNode: any, targetNode: any) => {
  // https://math.stackexchange.com/questions/1724792/an-algorithm-for-finding-the-intersection-point-between-a-center-of-vision-and-a
  const intersectionNodeWidth = intersectionNode.measured.width;
  const intersectionNodeHeight = intersectionNode.measured.height;
  const intersectionNodePosition = intersectionNode.internals.positionAbsolute;
  const targetPosition = targetNode.internals.positionAbsolute;
  const targetWidth = targetNode.measured.width;
  const targetHeight = targetNode.measured.height;

  const w = intersectionNodeWidth / 2;
  const h = intersectionNodeHeight / 2;

  const x2 = intersectionNodePosition.x + w;
  const y2 = intersectionNodePosition.y + h;
  const x1 = targetPosition.x + targetWidth / 2;
  const y1 = targetPosition.y + targetHeight / 2;

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  let x = w * (xx3 + yy3) + x2;
  let y = h * (-xx3 + yy3) + y2;

  if (
    [NODE_TYPE.START_NODE, NODE_TYPE.END_NODE]?.includes(intersectionNode?.type)
  ) {
    const { x: newX, y: newY } = findIntersectionOfWithCircle(x, y, x2, y2, w);
    x = newX;
    y = newY;
  }

  return { x, y };
};

// returns the parameters (sx, sy, tx, ty, sourcePos, targetPos) you need to create an edge
const getEdgeParams = (source: any, target: any) => {
  const sourceIntersectionPoint = getNodeIntersection(source, target);
  const targetIntersectionPoint = getNodeIntersection(target, source);

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
  };
};

export { getEdgeParams };
