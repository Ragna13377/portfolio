import aboutBackground from '../../../assets/about-stage-bg.webp';
import cloudsMid from '../../../assets/clouds-mid.webp';
import cloudsNear from '../../../assets/clouds-near.webp';
import projectsBackground from '../../../assets/project-stage-bg.webp';
import toolkitBackground from '../../../assets/toolkit-stage-bg.webp';

const images: HTMLImageElement[] = [];
let started = false;

export function preloadScreenBackgrounds() {
  if (started) return;
  started = true;
  for (const src of [
    aboutBackground,
    projectsBackground,
    toolkitBackground,
    cloudsMid,
    cloudsNear,
  ]) {
    const image = new Image();
    images.push(image);
    image.src = src;
    void image.decode?.().catch(() => undefined);
  }
}
