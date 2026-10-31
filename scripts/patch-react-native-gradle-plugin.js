/**
 * Patch @react-native/gradle-plugin for Gradle 8.9 and Kotlin 1.9 compatibility.
 */
const fs = require('fs');
const path = require('path');

const pluginBuildGradle = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native',
  'gradle-plugin',
  'build.gradle.kts'
);

if (!fs.existsSync(pluginBuildGradle)) {
  process.exit(0);
}

let content = fs.readFileSync(pluginBuildGradle, 'utf8');

// 1. Remove deprecated serviceOf import and testRuntimeOnly block
content = content.replace(
  'import org.gradle.configurationcache.extensions.serviceOf',
  '// import org.gradle.configurationcache.extensions.serviceOf'
);

content = content.replace(
  /testRuntimeOnly\(\s*files\(\s*serviceOf<ModuleRegistry>\(\)[\s\S]*?\)\s*\)/,
  '/* testRuntimeOnly removed for Gradle 8.9 */'
);

// 2. Bump kotlin version
content = content.replace(
  'kotlin("jvm") version "1.7.22"',
  'kotlin("jvm") version "1.9.24"'
);

// 3. Update Java & Kotlin compile targets
content = content.replace(
  /sourceCompatibility = JavaVersion\.VERSION_11\s+targetCompatibility = JavaVersion\.VERSION_11/,
  'sourceCompatibility = JavaVersion.VERSION_17\n  targetCompatibility = JavaVersion.VERSION_17'
);

content = content.replace(
  /tasks\.withType<KotlinCompile>\s*\{\s*kotlinOptions\s*\{[\s\S]*?\}\s*\}/,
  'tasks.withType<KotlinCompile> {\n  kotlinOptions {\n    jvmTarget = "17"\n    freeCompilerArgs = listOf("-Xskip-metadata-version-check")\n  }\n}'
);

fs.writeFileSync(pluginBuildGradle, content, 'utf8');
console.log('Patched @react-native/gradle-plugin/build.gradle.kts');

