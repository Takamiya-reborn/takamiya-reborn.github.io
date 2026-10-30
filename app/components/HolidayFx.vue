<script setup lang="ts">
// 节日场景调度：节日生效期内挂对应节日的定制场景组件，平时不渲染（生效规则见 useHoliday）
import type { Component } from "vue";
import HalloweenScene from "./holiday/HalloweenScene.vue";

const { active } = useHoliday();

// 节日名 → 场景组件注册表
const scenes: Record<string, Component> = { halloween: HalloweenScene };

const scene = computed(() => (active.value ? scenes[active.value.name] : undefined));
</script>

<template>
  <div v-if="scene" class="scene" aria-hidden="true">
    <component :is="scene" />
  </div>
</template>

<style scoped>
/* 全屏特效组件红线：fixed + 不拦截事件；场景组件的子元素都 absolute 锚到这里 */
.scene {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}
</style>
