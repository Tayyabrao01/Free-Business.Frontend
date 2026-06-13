/** Tab bar icon names: [outline, filled] for inactive/active */
export const TAB_ICONS = {
  Home: ['home-outline', 'home'],
  Posts: ['newspaper-outline', 'newspaper'],
  Groups: ['people-outline', 'people'],
  MessagesTab: ['chatbubbles-outline', 'chatbubbles'],
  CallsTab: ['call-outline', 'call'],
  MoreTab: ['grid-outline', 'grid'],
  Profile: ['person-outline', 'person'],
};

export const getTabIconName = (routeName, focused) => {
  const pair = TAB_ICONS[routeName] || ['ellipse-outline', 'ellipse'];
  return focused ? pair[1] : pair[0];
};
