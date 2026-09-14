import React from 'react';
import Svg, {
  Path,
  Polyline,
  Circle,
  Text as SvgText,
  Rect,
} from 'react-native-svg';
import type { EventZone, GeoPoint } from '../types/api';
import { projection } from '../services/geo';
export function ZoneMap({
  zones,
  center,
  route = [],
  position,
}: {
  zones: EventZone[];
  center: GeoPoint;
  route?: number[][];
  position?: GeoPoint;
}) {
  const points = [
    center.coordinates,
    ...zones.flatMap(z => z.boundary.coordinates.flat()),
    ...route,
    ...(position ? [position.coordinates] : []),
  ];
  const project = projection(points);
  const colors = ['#B7DFCC', '#A6CDE1', '#EDDBAD', '#D9C5E5'];
  return (
    <Svg
      width="100%"
      height={330}
      viewBox="0 0 340 330"
      accessibilityLabel="Carte des zones et étapes de livraison"
    >
      <Rect width={340} height={330} fill="#EFF5F1" />
      {zones.map((z, i) => {
        const label = project(z.boundary.coordinates[0][0]);
        return (
          <React.Fragment key={z.code}>
            <Path
              d={z.boundary.coordinates
                .map(
                  r => 'M' + r.map(p => project(p).join(',')).join(' L') + ' Z',
                )
                .join(' ')}
              fill={colors[i % colors.length]}
              fillRule="evenodd"
              stroke="#365544"
            />
            <SvgText
              x={label[0] + 4}
              y={label[1] - 4}
              fontSize={11}
              fill="#173D2B"
            >
              {z.code}
            </SvgText>
          </React.Fragment>
        );
      })}
      {route.length > 1 ? (
        <Polyline
          points={route.map(p => project(p).join(',')).join(' ')}
          stroke="#B55325"
          strokeWidth={3}
          fill="none"
        />
      ) : null}
      {route.map((p, i) => {
        const q = project(p);
        return (
          <React.Fragment key={i}>
            <Circle cx={q[0]} cy={q[1]} r={8} fill="#B55325" />
            <SvgText
              x={q[0]}
              y={q[1] + 4}
              textAnchor="middle"
              fontSize={11}
              fill="white"
            >
              {i + 1}
            </SvgText>
          </React.Fragment>
        );
      })}
      {position ? (
        <Circle
          cx={project(position.coordinates)[0]}
          cy={project(position.coordinates)[1]}
          r={6}
          fill="#176DD3"
        />
      ) : null}
    </Svg>
  );
}
