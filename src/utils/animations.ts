/**
 * DentalCare Pro — Sistema de Animaciones Premium
 * Elegantes, minimalistas y performantes (GPU-accelerated)
 */

// ═══════════════════════════════════════════════════
// EASINGS — Curvas de aceleración profesionales
// ═══════════════════════════════════════════════════
export const ease = {
    /** Apple-style smooth easing */
    smooth: [0.25, 0.1, 0.25, 1.0] as const,
    /** Elegant deceleration for entrances */
    out: [0.0, 0.0, 0.2, 1.0] as const,
    /** Subtle spring-like feel without actual spring */
    softBounce: [0.34, 1.56, 0.64, 1.0] as const,
    /** Premium ease for sliding content */
    slide: [0.4, 0.0, 0.2, 1.0] as const,
};

// ═══════════════════════════════════════════════════
// PAGE TRANSITIONS — Transiciones entre páginas
// ═══════════════════════════════════════════════════
export const pageTransition = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.4, ease: ease.out },
};

// ═══════════════════════════════════════════════════
// STAGGER CONTAINERS — Entrada escalonada de hijos
// ═══════════════════════════════════════════════════
export const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.06,
            delayChildren: 0.1,
        },
    },
};

export const staggerContainerSlow = {
    animate: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.15,
        },
    },
};

// ═══════════════════════════════════════════════════
// FADE IN VARIANTS — Entradas sutiles
// ═══════════════════════════════════════════════════

/** Fade up — ideal para cards y secciones */
export const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: ease.out },
    },
};

/** Fade in desde la izquierda — para sidebars y paneles */
export const fadeInLeft = {
    initial: { opacity: 0, x: -16 },
    animate: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.4, ease: ease.out },
    },
};

/** Fade in desde la derecha */
export const fadeInRight = {
    initial: { opacity: 0, x: 16 },
    animate: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.4, ease: ease.out },
    },
};

/** Fade in suave — solo opacidad */
export const fadeIn = {
    initial: { opacity: 0 },
    animate: {
        opacity: 1,
        transition: { duration: 0.35, ease: ease.smooth },
    },
};

/** Scale up — para modals, tooltips, dropdowns */
export const scaleIn = {
    initial: { opacity: 0, scale: 0.95 },
    animate: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.25, ease: ease.out },
    },
    exit: {
        opacity: 0,
        scale: 0.97,
        transition: { duration: 0.15, ease: ease.smooth },
    },
};

// ═══════════════════════════════════════════════════
// CARD VARIANTS — Para grids y listas
// ═══════════════════════════════════════════════════
export const cardVariant = {
    initial: { opacity: 0, y: 16, scale: 0.98 },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.4, ease: ease.out },
    },
};

/** List item — más ligero para listas largas */
export const listItemVariant = {
    initial: { opacity: 0, x: -8 },
    animate: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.3, ease: ease.out },
    },
};

// ═══════════════════════════════════════════════════
// MODAL BACKDROP + CONTENT
// ═══════════════════════════════════════════════════
export const backdropVariant = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalVariant = {
    initial: { opacity: 0, scale: 0.96, y: 10 },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0.3, ease: ease.out },
    },
    exit: {
        opacity: 0,
        scale: 0.97,
        y: 8,
        transition: { duration: 0.2, ease: ease.smooth },
    },
};

// ═══════════════════════════════════════════════════
// STAT NUMBER COUNTER — Para números animados
// ═══════════════════════════════════════════════════
export const numberVariant = {
    initial: { opacity: 0, y: 8 },
    animate: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: ease.out, delay: 0.2 },
    },
};

// ═══════════════════════════════════════════════════
// HOVER EFFECTS — Micro-interacciones
// ═══════════════════════════════════════════════════
export const hoverLift = {
    whileHover: {
        y: -2,
        transition: { duration: 0.2, ease: ease.smooth },
    },
    whileTap: { scale: 0.98 },
};

export const hoverScale = {
    whileHover: {
        scale: 1.02,
        transition: { duration: 0.2, ease: ease.smooth },
    },
    whileTap: { scale: 0.98 },
};

export const hoverGlow = {
    whileHover: {
        y: -1,
        boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
        transition: { duration: 0.25, ease: ease.smooth },
    },
};

// ═══════════════════════════════════════════════════
// SKELETON PULSE — Para estados de carga
// ═══════════════════════════════════════════════════
export const skeletonPulse = {
    initial: { opacity: 0.5 },
    animate: {
        opacity: [0.5, 0.8, 0.5],
        transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
    },
};

// ═══════════════════════════════════════════════════
// PROGRESS BAR — Para barras de progreso
// ═══════════════════════════════════════════════════
export const progressBar = (width: number) => ({
    initial: { width: 0 },
    animate: {
        width: `${width}%`,
        transition: { duration: 1, ease: ease.out, delay: 0.3 },
    },
});
