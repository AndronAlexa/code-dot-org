import React from 'react';
import { UnconnectedSummaryProgressTable as SummaryProgressTable } from './SummaryProgressTable';
import { LevelStatus } from '@cdo/apps/util/sharedConstants';
import { ViewType } from '@cdo/apps/code-studio/stageLockRedux';

const lessons = [
  {
    name: 'Jigsaw',
    id: 1
  },
  {
    name: 'Maze',
    id: 2
  },
  {
    name: 'Artist',
    id: 3
  },
  {
    name: 'Something',
    id: 4
  },
];
const levelsByLesson = [
  [
    {
      status: LevelStatus.not_tried,
      url: '/step1/level1',
      name: 'First progression'
    },
    {
      status: LevelStatus.perfect,
      url: '/step2/level1',
    },
    {
      status: LevelStatus.not_tried,
      url: '/step2/level2',
    },
    {
      status: LevelStatus.not_tried,
      url: '/step2/level3',
    },
    {
      status: LevelStatus.not_tried,
      url: '/step2/level4',
    },
    {
      status: LevelStatus.not_tried,
      url: '/step2/level5',
    },
    {
      status: LevelStatus.not_tried,
      url: '/step3/level1',
      name: 'Last progression'
    },
  ],
  [
    {
      status: LevelStatus.not_tried,
      url: '/step1/level1',
    },
    {
      status: LevelStatus.not_tried,
      url: '/step3/level1',
    },
  ],
  [
    {
      status: LevelStatus.not_tried,
      url: '/step1/level1',
    },
    {
      status: LevelStatus.not_tried,
      url: '/step3/level1',
    },
  ],
  [
    {
      status: LevelStatus.not_tried,
      url: '/step4/level1',
    },
    {
      status: LevelStatus.not_tried,
      url: '/step4/level1',
    },
  ]
];

export default storybook => {
  storybook
    .storiesOf('SummaryProgressTable', module)
    .addStoryTable([
      {
        name:'simple SummaryProgressTable',
        story: () => (
          <SummaryProgressTable
            lessons={lessons}
            levelsByLesson={levelsByLesson}
            lessonIsHidden={() => false}
          />
        )
      },
      {
        name:'even row is hidden, viewing as teacher',
        story: () => (
          <SummaryProgressTable
            lessons={lessons}
            levelsByLesson={levelsByLesson}
            viewAs={ViewType.Teacher}
            sectionId="11"
            lessonIsHidden={(lessonId, viewAs) =>
              (lessonId === 2 && viewAs === ViewType.Student)}
          />
        )
      },
      {
        name:'odd row is hidden, viewing as teacher',
        story: () => (
          <SummaryProgressTable
            lessons={lessons}
            levelsByLesson={levelsByLesson}
            viewAs={ViewType.Teacher}
            sectionId="11"
            lessonIsHidden={(lessonId, viewAs) =>
              (lessonId === 3 && viewAs === ViewType.Student)}
          />
        )
      },
      {
        name:'even row is hidden, viewing as student',
        description: 'Row 2 should not be visible',
        story: () => (
          <SummaryProgressTable
            lessons={lessons}
            levelsByLesson={levelsByLesson}
            viewAs={ViewType.Student}
            sectionId="11"
            lessonIsHidden={(lessonId, viewAs) =>
              (lessonId === 2 && viewAs !== ViewType.Teacher)}
          />
        )
      },
      {
        name:'odd row is hidden, viewing as student',
        description: 'Row 3 should not be visible',
        story: () => (
          <SummaryProgressTable
            lessons={lessons}
            levelsByLesson={levelsByLesson}
            viewAs={ViewType.Student}
            sectionId="11"
            lessonIsHidden={(lessonId, viewAs) =>
              (lessonId === 3 && viewAs !== ViewType.Teacher)}
          />
        )
      }
    ]);
};
