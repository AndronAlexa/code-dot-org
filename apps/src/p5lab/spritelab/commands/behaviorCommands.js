import {commands as actionCommands} from './actionCommands';

export const commands = {
  addBehaviorSimple(spriteArg, behavior) {
    let sprites = this.getSpriteArray(spriteArg);
    sprites.forEach(sprite => this.addBehavior(sprite, behavior));
  },

  Behavior(func) {
    return {func: func, name: func.funcName};
  },

  burstFunc() {
    return spriteArg => {
      const sprite = this.getSpriteArray(spriteArg)[0];
      if (sprite.delay === 0) {
        sprite.scale = 0.4 * sprite.baseScale;
      } else if (sprite.delay < 0) {
        const dy = Math.sin(sprite.direction) * sprite.speed;
        const dx = Math.cos(sprite.direction) * sprite.speed;
        sprite.x += dx;
        sprite.y += dy;
        sprite.scale += 0.01 * sprite.baseScale;
        sprite.rotation += 6;
      }
      sprite.delay -= 1;
    };
  },

  popFunc() {
    return spriteArg => {
      const sprite = this.getSpriteArray(spriteArg)[0];
      const dy = Math.sin(sprite.direction) * 5;
      const dx = Math.cos(sprite.direction) * 5;
      sprite.x += dx;
      sprite.y += dy;
      sprite.y -= sprite.speed;
      sprite.speed -= 1;
      sprite.rotation += (sprite.direction - 270) / 6;
    };
  },

  rainFunc() {
    return spriteArg => {
      const sprite = this.getSpriteArray(spriteArg)[0];
      sprite.y -= sprite.speed;
      sprite.speed -= 0.5;
      sprite.rotation += Math.floor(Math.random() * 10 - 5);
    };
  },
  spiralFunc() {
    return spriteArg => {
      const sprite = this.getSpriteArray(spriteArg)[0];
      if (sprite.delay <= 0) {
        sprite.scale += 0.01 * sprite.baseScale;
        sprite.x =
          200 +
          Math.cos(
            ((-sprite.delay * 6 - sprite.initialAngle) * Math.PI) / 180
          ) *
            -sprite.delay *
            6;
        sprite.y =
          200 +
          Math.sin(
            ((-sprite.delay * 6 - sprite.initialAngle) * Math.PI) / 180
          ) *
            -sprite.delay *
            6;
        sprite.rotation -= 12;
      }
      sprite.delay -= 1;
    };
  },

  draggableFunc() {
    return spriteArg => {
      let sprite = this.getSpriteArray(spriteArg)[0];
      const allSprites = this.getSpriteArray({costume: 'all'});
      if (this.p5.mousePressedOver(sprite) && this.p5.mouseWentDown()) {
        const topOtherSprite = Math.max(
          ...allSprites
            .filter(s => s !== sprite && this.p5.mousePressedOver(s))
            .map(s => s.depth)
        );
        if (sprite.depth > topOtherSprite) {
          sprite.dragging = true;
          sprite.xOffset = sprite.x - this.p5.World.mouseX;
          sprite.yOffset = sprite.y - this.p5.World.mouseY;
        }
      }
      if (sprite.dragging) {
        sprite.x = this.p5.World.mouseX + sprite.xOffset;
        sprite.y = this.p5.World.mouseY + sprite.yOffset;
      }
      if (this.p5.mouseWentUp()) {
        sprite.dragging = false;
      }
    };
  },

  glideFunc() {
    return spriteArg => {
      let sprite = this.getSpriteArray(spriteArg)[0];
      if (sprite.glideTargets?.length > 0) {
        let currentTarget = sprite.glideTargets[0];
        let distance = Math.sqrt(
          (sprite.x - currentTarget.x) ** 2 + (sprite.y - currentTarget.y) ** 2
        );
        if (distance < sprite.speed) {
          sprite.x = currentTarget.x;
          sprite.y = currentTarget.y;
          sprite.glideTargets.shift();
        } else {
          let angle = Math.atan2(
            currentTarget.y - sprite.y,
            currentTarget.x - sprite.x
          );
          if (!isNaN(angle)) {
            let dy = Math.sin(angle) * sprite.speed;
            let dx = Math.cos(angle) * sprite.speed;
            sprite.x += dx;
            sprite.y += dy;
          }
        }
      }
    };
  },

  avoidingTargetsFunc() {
    return spriteArg => {
      const sprite = this.getSpriteArray(spriteArg)[0];
      const spritePosition = sprite.position;

      if (!sprite.targetSet?.avoid) {
        return;
      }

      const range = 100;
      const targetsInRange = sprite.targetSet.avoid
        .map(x => this.getSpriteArray({costume: x}))
        .flat()
        .filter(target => spritePosition.dist(target.position) < range);

      if (targetsInRange.length === 0) {
        return;
      }

      // Find the average position of all the targets in range
      let totalX = 0;
      let totalY = 0;
      targetsInRange.forEach(target => {
        totalX += target.position.x;
        totalY += target.position.y;
      });
      const averagePosition = this.p5.createVector(
        totalX / targetsInRange.length,
        totalY / targetsInRange.length
      );

      actionCommands.moveToward.apply(this, [spriteArg, -5, averagePosition]);
      actionCommands.edgesDisplace.apply(this, [spriteArg]);
    };
  },

  followingTargetsFunc() {
    return spriteArg => {
      const sprite = this.getSpriteArray(spriteArg)[0];
      const spritePosition = sprite.position;

      if (!sprite.targetSet?.follow) {
        return;
      }

      const targets = sprite.targetSet.follow
        .map(x => this.getSpriteArray({costume: x}))
        .flat();

      if (targets.length === 0) {
        return;
      }

      // Find closest target
      let closestTarget;
      let closestDistance = Infinity;
      targets.forEach(target => {
        const distance = spritePosition.dist(target.position);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestTarget = target;
        }
      });
      actionCommands.moveToward.apply(this, [
        spriteArg,
        5,
        closestTarget.position
      ]);
    };
  },

  removeAllBehaviors(spriteArg) {
    let sprites = this.getSpriteArray(spriteArg);
    sprites.forEach(sprite => this.removeAllBehaviors(sprite));
  },

  removeBehaviorSimple(spriteArg, behavior) {
    let sprites = this.getSpriteArray(spriteArg);
    sprites.forEach(sprite => this.removeBehavior(sprite, behavior));
  }
};
