import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { View, Linking } from 'react-native';
import { BottomNavigation, Appbar, useTheme } from 'react-native-paper';
import Account from './Account';
import { User } from './interfaces';
import Teachers from './Teachers';
import Members from './Members';
import Parents from './Parents';
import School from './School';

export default function Settings(props: { domain: string | undefined; info: User | null; ws: WebSocket | undefined; setSettings: Dispatch<SetStateAction<boolean>>; }) {
    const [index, setIndex] = useState(0);
    const [routes] = useState([
      { key: 'account', title: 'Account', focusedIcon: 'account' },
      { key: 'parents', title: 'Parents', focusedIcon: 'human-male-child' },
      { key: 'members', title: 'Members', focusedIcon: 'account-multiple' },
      { key: 'school', title: 'School', focusedIcon: 'school' },
      { key: 'github', title: 'GitHub', focusedIcon: 'github' }
    ].filter(x => (x.key === 'school' && props.info?.administrator) || x.key !== 'school').map(x => {
      if(!props.info?.administrator && x.key === 'members') {
        x.key = 'teachers';
        x.title = 'Teachers';
        x.focusedIcon = 'school';
      }
      return x;
    }));

      const { colors } = useTheme();

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Appbar.Header>
            <Appbar.BackAction onPress={() => props.setSettings(false)} />
      <Appbar.Content title={routes[index].title} />
    </Appbar.Header>
          <BottomNavigation navigationState={{index, routes}} onIndexChange={index => {
            if(routes[index].key !== 'github') {
              setIndex(index);
            } else {
              Linking.openURL('https://github.com/Scunea');
            }
          }} renderScene={({ route }) => {
    switch (route.key) {
      case 'account': 
        return <Account domain={props.domain} info={props.info} ws={props.ws} />;
      case 'parents':
        return <Parents domain={props.domain} info={props.info} ws={props.ws} />
      case 'teachers':
        return <Teachers domain={props.domain} info={props.info} ws={props.ws} />
      case 'members':
        return <Members domain={props.domain} info={props.info} ws={props.ws} />
      case 'school':
        return <School domain={props.domain} info={props.info} ws={props.ws} />
      case 'github':
        return null;
    }
  }} />
        </View>
    );
  }