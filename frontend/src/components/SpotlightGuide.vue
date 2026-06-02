<script setup>
import { computed, onMounted, ref } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: "GUÍA RÁPIDA",
  },
  desc: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: "mdi-information",
  },
  color: {
    type: String,
    default: "primary",
  },
  progress: {
    type: Number,
    default: 0,
  },
  buttonText: {
    type: String,
    default: "¡ENTENDIDO, VAMOS!",
  },
  storageKey: {
    type: String,
    default: "spotlight_view_count"
  }
});

const emit = defineEmits(["update:modelValue", "close"]);

const close = () => {
  emit("update:modelValue", false);
  emit("close");
};

onMounted(() => {
  const views = parseInt(localStorage.getItem(props.storageKey) || "0");
  if (views >= 5) {
    emit("update:modelValue", false);
  } else {
    localStorage.setItem(props.storageKey, (views + 1).toString());
  }
});
</script>

<template>
  <v-overlay
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    class="align-center justify-center"
    persistent
    scrim="#000000"
    :opacity="0.9"
    attach="body"
    z-index="3000"
  >
    <!-- TELEPORT PARA MOVER EL BOTÓN AL CUERPO DEL DOCUMENTO (ESQUINA REAL DEL MONITOR) -->
    <Teleport to="body">
      <div v-if="modelValue" class="spotlight-close-container">
        <v-btn
          icon="mdi-close"
          variant="text"
          size="x-large"
          color="white"
          @click="close"
          class="close-button-absolute"
        ></v-btn>
      </div>
    </Teleport>

    <v-card
      width="550"
      class="rounded-xl pa-10 text-center elevation-24 bg-white overflow-hidden"
      :style="{ borderTop: '12px solid var(--v-theme-' + color + ')' }"
    >
      <!-- Indicador de Progreso Sutil -->
      <v-progress-linear
        v-if="progress > 0"
        :model-value="progress"
        :color="color"
        height="8"
        absolute
        top
      ></v-progress-linear>

      <div class="d-flex justify-center align-center mb-8">
        <span :class="'text-overline font-weight-black text-' + color" style="font-size: 0.9rem !important;">
          {{ subtitle }}
        </span>
      </div>

      <v-avatar
        :color="color + '-lighten-5'"
        size="160"
        class="mb-8 animate-bounce border-lg"
        :style="{ borderColor: 'rgba(var(--v-theme-' + color + '), 0.2) !important' }"
      >
        <v-icon :color="color" size="90">{{ icon }}</v-icon>
      </v-avatar>

      <h2
        class="text-h3 font-weight-black mb-6 text-uppercase"
        :class="'text-' + color"
        style="letter-spacing: -1.5px !important; line-height: 1"
      >
        {{ title }}
      </h2>

      <p class="text-h5 text-grey-darken-1 line-height-relaxed mb-10 px-6">
        {{ desc }}
      </p>

      <v-btn
        :color="color"
        block
        size="x-large"
        class="rounded-lg font-weight-black text-uppercase shadow-lg"
        @click="close"
        height="80"
        elevation="16"
        style="font-size: 1.2rem !important;"
      >
        {{ buttonText }}
        <v-icon end icon="mdi-chevron-right" size="28" class="ml-2"></v-icon>
      </v-btn>

      <p class="text-body-2 text-grey-lighten-1 mt-6 text-uppercase font-weight-bold">
        O presiona la 'X' en la esquina para saltar
      </p>
    </v-card>
  </v-overlay>
</template>

<style>
/* Estilos globales para el botón teleportado */
.spotlight-close-container {
  position: fixed !important;
  top: 20px !important;
  right: 20px !important;
  z-index: 99999 !important; /* Por encima de todo */
}
.close-button-absolute {
  opacity: 0.8;
  transition: opacity 0.2s, transform 0.2s;
}
.close-button-absolute:hover {
  opacity: 1;
  transform: scale(1.1);
}
</style>

<style scoped>
.line-height-relaxed {
  line-height: 1.5 !important;
}
.animate-bounce {
  animation: bounce 3s infinite;
}
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}
.shadow-lg {
  box-shadow: 0 15px 40px -12px rgba(var(--v-theme-primary), 0.5) !important;
}
</style>
