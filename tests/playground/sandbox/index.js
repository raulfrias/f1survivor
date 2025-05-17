import {
  svg,
  animate,
} from '../../../lib/anime.esm.js';

animate(svg.createDrawable('svg circle'), {
  draw: '0 1',
  alternate: true,
  loop: true,
  duration: 4000,
});