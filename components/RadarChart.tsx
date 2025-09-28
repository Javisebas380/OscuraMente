import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';

interface RadarChartProps {
  data: { [key: string]: number };
  size?: number;
  ringStrokeWidth?: number;
  vertexLabelFontSize?: number;
  pointRadius?: number;
  showTicks?: boolean;
  tickValues?: number[];
  accentColor?: string;
}

export default function RadarChart({ 
  data, 
  size = 420,
  ringStrokeWidth = 0.5,
  vertexLabelFontSize = 15,
  pointRadius = 5,
  showTicks = true,
  tickValues = [25, 50, 75, 100],
  accentColor = '#C8A951' 
}: RadarChartProps) {
  const center = size / 2; 
  const maxRadius = size * 0.33;
  const padding = size * 0.01;
  const traits = Object.keys(data);
  const values = Object.values(data);
  
  // Calculate points for the polygon
  const getPoint = (value: number, index: number) => {
    const angle = (index * 2 * Math.PI) / traits.length - Math.PI / 2;
    const radius = (value / 100) * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  // Calculate label positions
  const getLabelPoint = (index: number) => {
    const angle = (index * 2 * Math.PI) / traits.length - Math.PI / 2;
    const radius = maxRadius + padding * 0.6;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  // Create polygon points string
  const polygonPoints = values
    .map((value, index) => {
      const point = getPoint(value, index);
      return `${point.x},${point.y}`;
    })
    .join(' ');

  // Reference rings
  const rings = showTicks ? tickValues : [25, 50, 75, 100];

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Reference rings */}
        {rings.map((ring) => ring > 0 && (
          <Circle
            key={ring}
            cx={center}
            cy={center}
            r={(ring / 100) * maxRadius}
            fill="none"
            stroke="#374151"
            strokeWidth={ringStrokeWidth}
            opacity={0.25}
          />
        ))}

        {/* Axis lines */}
        {traits.map((_, index) => {
          const angle = (index * 2 * Math.PI) / traits.length - Math.PI / 2;
          const endX = center + maxRadius * Math.cos(angle);
          const endY = center + maxRadius * Math.sin(angle);
          
          return (
            <Line
              key={index}
              x1={center}
              y1={center}
              x2={endX}
              y2={endY}
              stroke="#1A1A1A"
              strokeWidth={ringStrokeWidth}
              opacity={0.4}
            />
          );
        })}

        {/* Data polygon */}
        <Polygon
          points={polygonPoints}
          fill={`${accentColor}1F`}
          stroke={accentColor}
          strokeWidth={2.0}
          opacity={0.8}
        />

        {/* Data points */}
        {values.map((value, index) => {
          const point = getPoint(value, index);
          return (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={pointRadius}
              fill={accentColor}
              stroke="#0D0D0D"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Trait labels */}
        {traits.map((trait, index) => {
          const labelPoint = getLabelPoint(index);
          // Format trait name: replace underscores with spaces and capitalize each word
          const traitName = trait
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
          
          return (
            <SvgText
              key={trait}
              x={labelPoint.x}
              y={labelPoint.y}
              fontSize={vertexLabelFontSize.toString()}
              fill="#FFFFFF"
              textAnchor="middle"
              alignmentBaseline="middle"
              fontFamily="Inter-SemiBold"
              stroke="#0D0D0D"
              strokeWidth="0.5"
              paintOrder="stroke"
            >
              {traitName}
            </SvgText>
          );
        })}

      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    backgroundColor: 'transparent',
  },
});