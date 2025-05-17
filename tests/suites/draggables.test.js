import {
  expect,
  getChildAtIndex,
  forEachChildren,
} from '../utils.js';

import {
  createDraggable,
  utils,
} from '../../src/anime.js';

suite('Draggables', () => {
  test('Triggering a reset in the onSettle callback should correctly set the values', resolve => {
    const draggable = createDraggable('#target-id', {
      container: '#css-tests',
      onSettle: self => {
        self.reset();
        expect(utils.get('#target-id', 'x', false)).to.equal(0);
        expect(utils.get('#target-id', 'y', false)).to.equal(0);
        resolve();
      }
    });

    draggable.animate.translateX(100, 10);
    draggable.animate.translateY(100, 10);
  });
});
