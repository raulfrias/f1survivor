import {
  expect,
} from '../utils.js';

import {
  createAnimatable,
  createTimer,
  utils,
} from '../../src/anime.js';

suite('Animatables', () => {

  test('Get and animate animatable values', resolve => {
    const animatable = createAnimatable('#target-id', {
      x: 20,
      y: 30,
      rotate: 40,
    });

    expect(animatable.x()).to.equal(0);
    expect(animatable.y()).to.equal(0);
    expect(animatable.rotate()).to.equal(0);

    const x = animatable.x(100);
    const y = animatable.y(150);
    const rotate = animatable.rotate(45);

    expect(animatable.animations.x.duration).to.equal(20);
    expect(animatable.animations.y.duration).to.equal(30);
    expect(animatable.animations.rotate.duration).to.equal(40);

    createTimer({
      duration: 50,
      onComplete: () => {
        expect(animatable.x()).to.equal(100);
        expect(animatable.y()).to.equal(150);
        expect(animatable.rotate()).to.equal(45);
        resolve();
      }
    });
  });

  test('Get and animate animatable complex values', resolve => {
    const animatable = createAnimatable('#target-id', {
      backgroundColor: 20,
    });

    expect(animatable.backgroundColor()).deep.equal([0, 214, 114, 1]);

    const bg = animatable.backgroundColor([100, 200, 0, 1]);

    expect(animatable.animations.backgroundColor.duration).to.equal(20);

    createTimer({
      duration: 50,
      onComplete: () => {
        expect(animatable.backgroundColor()).deep.equal([100, 200, 0, 1]);
        resolve();
      }
    });
  });

  test('Get and set animatable values', () => {
    const animatable = createAnimatable('#target-id', {
      x: 0,
      y: 0,
      rotate: 0,
    });

    expect(animatable.x()).to.equal(0);
    expect(animatable.y()).to.equal(0);
    expect(animatable.rotate()).to.equal(0);

    animatable.x(100);
    animatable.y(150);
    animatable.rotate(45);

    expect(animatable.x()).to.equal(100);
    expect(animatable.y()).to.equal(150);
    expect(animatable.rotate()).to.equal(45);
  });

  test('Defines custom units for animatable values', resolve => {
    const animatable = createAnimatable('#target-id', {
      x: { unit: 'em' },
      y: { unit: 'rem' },
      rotate: { unit: 'rad', duration: 50 },
      duration: 40
    });

    expect(animatable.x()).to.equal(0);
    expect(animatable.y()).to.equal(0);
    expect(animatable.rotate()).to.equal(0);

    animatable.x(10);
    animatable.y(15);
    animatable.rotate(1);

    createTimer({
      duration: 50,
      onComplete: () => {
        expect(animatable.x()).to.equal(10);
        expect(animatable.y()).to.equal(15);
        expect(animatable.rotate()).to.equal(1);
        expect(utils.get('#target-id', 'x')).to.equal('10em');
        expect(utils.get('#target-id', 'y')).to.equal('15rem');
        expect(utils.get('#target-id', 'rotate')).to.equal('1rad');
        resolve();
      }
    });
  });

  test('Revert an animatable', () => {
    const animatable = createAnimatable('#target-id', {
      x: { unit: 'em' },
      y: { unit: 'rem' },
      rotate: { unit: 'rad', duration: 50 },
      duration: 40
    });

    expect(animatable.targets.length).to.equal(1);

    animatable.revert();

    expect(animatable.targets.length).to.equal(0);
    expect(animatable.animations.x).to.equal(undefined);
    expect(animatable.animations.y).to.equal(undefined);
    expect(animatable.animations.rotate).to.equal(undefined);
  });

});
