import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';

interface OptionItemProps {
  option: string;
  index: number;
  isSelected: boolean;
  onSelect: (index: number) => void;
  currentQuestion: number;
  accentColor: string;
}

export default function OptionItem({ 
  option, 
  index, 
  isSelected, 
  onSelect, 
  currentQuestion, 
  accentColor 
}: OptionItemProps) {
  const optionAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    // Reset animations when question changes
    optionAnim.setValue(0);
    scaleAnim.setValue(0.98);
    
    Animated.parallel([
      Animated.timing(optionAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentQuestion, index]);

  return (
    <Animated.View
      style={{
        opacity: optionAnim,
        transform: [
          { scale: scaleAnim },
          {
            translateX: optionAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            })
          }
        ]
      }}
    >
      <TouchableOpacity
        style={[
          styles.optionButton,
          isSelected && [
            styles.optionSelected,
            { borderColor: accentColor }
          ]
        ]}
        onPress={() => onSelect(index)}
        activeOpacity={0.9}
      >
        <View style={styles.optionContent}>
          <View style={[
            styles.radioButton,
            isSelected && [
              styles.radioSelected,
              { borderColor: accentColor }
            ]
          ]}>
            {isSelected && (
              <View style={[
                styles.radioInner,
                { backgroundColor: accentColor }
              ]} />
            )}
          </View>
          <Text style={[
            styles.optionText,
            isSelected && [
              styles.optionTextSelected,
              { color: accentColor }
            ]
          ]}>
            {option}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = {
  optionButton: {
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  optionSelected: {
    borderWidth: 1.5,
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  optionContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 24,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#404040',
    marginRight: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  radioSelected: {
    borderWidth: 2,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  optionText: {
    fontSize: 16,
    color: '#F5F5F5',
    fontFamily: 'Inter-Regular',
    flex: 1,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  optionTextSelected: {
    fontFamily: 'Inter-Medium',
  },
};