import React, { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';

const ExpandableText = ({
  text,
  maxLength = 160,
  maxLines = 3,
  style,
  readMoreStyle,
  hashtagStyle,
  containerStyle,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!text || typeof text !== 'string') return null;

  const lines = text.split('\n');
  const isLong = text.length > maxLength || lines.length > maxLines;

  const renderFormattedTokens = (rawText) => {
    const tokens = rawText.split(/(\s+)/);
    return tokens.map((token, idx) => {
      if (token.startsWith('#') && token.length > 1) {
        return (
          <Text key={idx} style={[styles.hashtag, hashtagStyle]}>
            {token}
          </Text>
        );
      }
      return token;
    });
  };

  if (!isLong) {
    return (
      <View style={[styles.wrap, containerStyle]}>
        <Text style={[styles.text, style]}>{renderFormattedTokens(text)}</Text>
      </View>
    );
  }

  const truncated = text.slice(0, maxLength).trim();

  return (
    <View style={[styles.wrap, containerStyle]}>
      <Text style={[styles.text, style]}>
        {expanded ? renderFormattedTokens(text) : renderFormattedTokens(truncated)}
        {!expanded ? '... ' : ' '}
        <Text
          style={[styles.readMore, readMoreStyle]}
          onPress={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : 'Read more'}
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 10,
  },
  text: {
    fontSize: 14.5,
    color: '#E2E2EA',
    lineHeight: 21,
  },
  hashtag: {
    color: '#E0B548',
    fontWeight: '600',
  },
  readMore: {
    color: '#D4AF37',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default ExpandableText;

