# Nivel Fit

App personal de gimnasio, instalable en el celular (PWA). Sin servidor: los datos quedan guardados en el teléfono.

**Abrir:** https://fedeshaquito.github.io/fitness-app/

## Qué incluye (v1)
- Rutina Lunes a Viernes con plan de reintroducción de 6 semanas (adaptación → base → progresión → construcción).
- Registro de kg, reps y series, con temporizador de descanso.
- Sugerencia de progresión automática (doble progresión: al completar el tope de reps, sube el peso).
- XP, niveles, niveles por grupo muscular, rachas, récords personales y logros.
- Guía de técnica por ejercicio con demostración animada (imágenes de [free-exercise-db](https://github.com/yuhonas/free-exercise-db), dominio público) y enlace a videos.
- Registro de peso y cintura con gráfico, IMC y estimación de calorías y proteína.
- Registro de bici y cardio. Misiones diarias: agua, sueño y pasos.
- Respaldo: exportar e importar los datos en JSON (Ajustes).

## Próximas versiones
- Plan de comidas económico, lista de compras y meal prep (`state.nutrition` ya está preparado).
- Integración con Health Connect / reloj (`state.activities[].source` y `state.integrations`).

## Editar la rutina
Los ejercicios, fases y logros están en `data.js`.
