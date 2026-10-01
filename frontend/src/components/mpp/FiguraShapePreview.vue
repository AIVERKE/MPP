<script setup>
import { computed } from 'vue';
import { getFiguraVisuals } from '@/utils/figuras';

const props = defineProps({
  codigo: {
    type: String,
    default: 'rectangulo',
  },
  /** Color de relleno; si no se pasa, usa el color suave de la forma. */
  colorHex: {
    type: String,
    default: null,
  },
  /** sm | md | lg */
  size: {
    type: String,
    default: 'md',
  },
});

const visuals = computed(() => getFiguraVisuals(props.codigo));
const fill = computed(() => props.colorHex || visuals.value.colorHex);
const shapeClass = computed(() => `shape-${visuals.value.codigo}`);
</script>

<template>
  <div
    class="figura-shape-preview"
    :class="[`is-${size}`, shapeClass]"
    :style="{ backgroundColor: fill }"
    :title="visuals.nombre"
    aria-hidden="true"
  />
</template>

<style scoped>
.figura-shape-preview {
  display: inline-block;
  flex-shrink: 0;
  box-sizing: border-box;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
}

/* Tamaños */
.is-sm.shape-rectangulo,
.is-sm.shape-elipse,
.is-sm.shape-paralelogramo {
  width: 36px;
  height: 22px;
}
.is-sm.shape-circulo,
.is-sm.shape-rombo {
  width: 26px;
  height: 26px;
}
.is-sm.shape-triangulo {
  width: 28px;
  height: 24px;
}
.is-sm.shape-hexagono {
  width: 32px;
  height: 22px;
}

.is-md.shape-rectangulo,
.is-md.shape-elipse,
.is-md.shape-paralelogramo {
  width: 64px;
  height: 40px;
}
.is-md.shape-circulo,
.is-md.shape-rombo {
  width: 48px;
  height: 48px;
}
.is-md.shape-triangulo {
  width: 52px;
  height: 46px;
}
.is-md.shape-hexagono {
  width: 58px;
  height: 40px;
}

.is-lg.shape-rectangulo,
.is-lg.shape-elipse,
.is-lg.shape-paralelogramo {
  width: 88px;
  height: 52px;
}
.is-lg.shape-circulo,
.is-lg.shape-rombo {
  width: 64px;
  height: 64px;
}
.is-lg.shape-triangulo {
  width: 70px;
  height: 60px;
}
.is-lg.shape-hexagono {
  width: 78px;
  height: 52px;
}

/* Formas */
.shape-rectangulo {
  border-radius: 6px;
}

.shape-circulo {
  border-radius: 50%;
}

.shape-rombo {
  border-radius: 4px;
  transform: rotate(45deg);
}

.shape-elipse {
  border-radius: 9999px;
}

.shape-paralelogramo {
  border-radius: 2px;
  transform: skewX(-20deg);
}

.shape-triangulo {
  border-radius: 0;
  border: none;
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  box-shadow: none;
}

.shape-hexagono {
  border-radius: 0;
  border: none;
  clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
  box-shadow: none;
}
</style>
