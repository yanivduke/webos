<template>
  <div class="regex-tester">
    <div class="tool-header">
      <h3>🔍 Regex Tester</h3>
      <p class="tool-desc">Test regular expressions with live highlighting</p>
    </div>

    <div class="tool-content">
      <!-- Pattern Input -->
      <div class="input-section">
        <label>Regular Expression:</label>
        <div class="regex-input-wrapper">
          <span class="regex-delimiter">/</span>
          <input
            v-model="pattern"
            type="text"
            class="amiga-input regex-pattern"
            placeholder="Enter regex pattern"
            @input="testRegex"
          />
          <span class="regex-delimiter">/</span>
          <input
            v-model="flags"
            type="text"
            class="amiga-input regex-flags"
            placeholder="gmi"
            maxlength="5"
            @input="testRegex"
          />
        </div>
        <div v-if="error" class="error-message">{{ error }}</div>
      </div>

      <!-- Test String Input -->
      <div class="input-section">
        <label>Test String:</label>
        <textarea
          v-model="testString"
          class="amiga-textarea"
          rows="6"
          placeholder="Enter text to test against the regex pattern"
          @input="testRegex"
        ></textarea>
      </div>

      <!-- Results -->
      <div class="results-section">
        <div class="results-header">
          <label>Results:</label>
          <span class="match-count" :class="{ 'has-matches': matchCount > 0 }">
            {{ matchCount }} match{{ matchCount !== 1 ? 'es' : '' }} found
          </span>
        </div>

        <div class="highlighted-output" v-html="highlightedText"></div>

        <div v-if="matches.length > 0" class="matches-list">
          <h4>Match Details:</h4>
          <div v-for="(match, index) in matches" :key="index" class="match-item">
            <span class="match-index">[{{ index }}]</span>
            <span class="match-value">{{ match.value }}</span>
            <span class="match-position">({{ match.start }}-{{ match.end }})</span>
            <div v-if="match.groups && match.groups.length > 0" class="match-groups">
              <span v-for="(group, gIdx) in match.groups" :key="gIdx" class="match-group">
                Group {{ gIdx + 1 }}: {{ group }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Reference -->
      <div class="reference-section">
        <h4>Quick Reference:</h4>
        <div class="reference-grid">
          <div class="ref-item"><code>\d</code> - Digit</div>
          <div class="ref-item"><code>\w</code> - Word character</div>
          <div class="ref-item"><code>\s</code> - Whitespace</div>
          <div class="ref-item"><code>.</code> - Any character</div>
          <div class="ref-item"><code>*</code> - 0 or more</div>
          <div class="ref-item"><code>+</code> - 1 or more</div>
          <div class="ref-item"><code>?</code> - 0 or 1</div>
          <div class="ref-item"><code>^</code> - Start of line</div>
          <div class="ref-item"><code>$</code> - End of line</div>
          <div class="ref-item"><code>[abc]</code> - Character class</div>
          <div class="ref-item"><code>(x|y)</code> - Alternation</div>
          <div class="ref-item"><code>(...)</code> - Capture group</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

const pattern = ref('\\w+@\\w+\\.\\w+');
const flags = ref('g');
const testString = ref('Contact us at support@example.com or sales@test.org');
const error = ref('');
const matches = ref<Array<{ value: string; start: number; end: number; groups: string[] }>>([]);

const matchCount = computed(() => matches.value.length);

const testRegex = () => {
  error.value = '';
  matches.value = [];

  if (!pattern.value) {
    return;
  }

  try {
    const regex = new RegExp(pattern.value, flags.value);
    const text = testString.value;
    let match;

    if (flags.value.includes('g')) {
      // Global search
      while ((match = regex.exec(text)) !== null) {
        matches.value.push({
          value: match[0],
          start: match.index,
          end: match.index + match[0].length,
          groups: match.slice(1)
        });
      }
    } else {
      // Single match
      match = regex.exec(text);
      if (match) {
        matches.value.push({
          value: match[0],
          start: match.index,
          end: match.index + match[0].length,
          groups: match.slice(1)
        });
      }
    }
  } catch (e: any) {
    error.value = 'Invalid regex: ' + e.message;
  }
};

const highlightedText = computed(() => {
  if (!testString.value || matches.value.length === 0) {
    return escapeHtml(testString.value);
  }

  let result = '';
  let lastIndex = 0;

  // Sort matches by position
  const sortedMatches = [...matches.value].sort((a, b) => a.start - b.start);

  sortedMatches.forEach((match, idx) => {
    // Add text before match
    result += escapeHtml(testString.value.substring(lastIndex, match.start));
    // Add highlighted match
    result += `<span class="highlight" data-match="${idx}">${escapeHtml(match.value)}</span>`;
    lastIndex = match.end;
  });

  // Add remaining text
  result += escapeHtml(testString.value.substring(lastIndex));

  return result;
});

const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
};

// Test on mount
testRegex();
</script>

<style scoped>
.regex-tester {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
  overflow-y: auto;
}

.tool-header {
  background: #0055aa;
  color: #ffffff;
  padding: 12px;
  border-bottom: 2px solid #000000;
}

.tool-header h3 {
  margin: 0 0 4px 0;
  font-size: 11px;
}

.tool-desc {
  margin: 0;
  font-size: 8px;
  opacity: 0.9;
}

.tool-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}

.input-section {
  margin-bottom: 16px;
}

.input-section label {
  display: block;
  font-size: 9px;
  color: #000000;
  margin-bottom: 6px;
}

.regex-input-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.regex-delimiter {
  font-size: 14px;
  font-weight: bold;
  color: #0055aa;
}

.amiga-input {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 6px 8px;
  font-size: 10px;
  font-family: 'Courier New', monospace;
  color: #000000;
  width: 100%;
}

.regex-pattern {
  flex: 1;
}

.regex-flags {
  width: 60px;
}

.amiga-textarea {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 8px;
  font-size: 10px;
  font-family: 'Courier New', monospace;
  color: #000000;
  width: 100%;
  resize: vertical;
}

.error-message {
  margin-top: 6px;
  padding: 6px;
  background: #ff0000;
  color: #ffffff;
  font-size: 8px;
  border: 2px solid #000000;
}

.results-section {
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 12px;
  margin-bottom: 16px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 2px solid #000000;
}

.results-header label {
  font-size: 9px;
  color: #000000;
  margin: 0;
}

.match-count {
  font-size: 8px;
  color: #666666;
  padding: 4px 8px;
  background: #e0e0e0;
  border: 1px solid #888888;
}

.match-count.has-matches {
  background: #00ff00;
  color: #000000;
  font-weight: bold;
}

.highlighted-output {
  background: #f0f0f0;
  border: 2px solid #888888;
  padding: 8px;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  min-height: 60px;
  max-height: 200px;
  overflow-y: auto;
  line-height: 1.6;
}

.highlighted-output :deep(.highlight) {
  background: #ffff00;
  color: #000000;
  font-weight: bold;
  padding: 2px;
  border: 1px solid #ff8800;
}

.matches-list {
  margin-top: 12px;
}

.matches-list h4 {
  font-size: 9px;
  margin: 0 0 8px 0;
  color: #0055aa;
}

.match-item {
  background: #f5f5f5;
  border: 1px solid #888888;
  padding: 6px;
  margin-bottom: 6px;
  font-size: 8px;
}

.match-index {
  color: #0055aa;
  font-weight: bold;
  margin-right: 8px;
}

.match-value {
  color: #000000;
  font-family: 'Courier New', monospace;
  background: #ffffff;
  padding: 2px 4px;
  border: 1px solid #888888;
}

.match-position {
  color: #666666;
  margin-left: 8px;
  font-size: 7px;
}

.match-groups {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid #cccccc;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.match-group {
  background: #e0e0ff;
  padding: 2px 4px;
  border: 1px solid #8888ff;
  font-size: 7px;
}

.reference-section {
  background: #e0e0e0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 12px;
}

.reference-section h4 {
  font-size: 9px;
  margin: 0 0 8px 0;
  color: #0055aa;
}

.reference-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 6px;
}

.ref-item {
  font-size: 8px;
  color: #000000;
  padding: 4px;
  background: #ffffff;
  border: 1px solid #888888;
}

.ref-item code {
  color: #0055aa;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}
</style>
