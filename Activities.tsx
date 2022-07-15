import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import FuzzySet from 'fuzzyset';
import { AnimatedFAB, Card, Paragraph, Title, Portal, Text, Button, Dialog, IconButton, Searchbar, Chip } from 'react-native-paper';
import DatePicker from 'react-native-date-picker'
import MaxModal from './MaxModal';
import ReadActivity from './ReadActivity';
import EditActivity from './EditActivity';
import NewActivity from './NewActivity';
import { Activity, User } from './interfaces';

export default function Activities(props: { domain: string | undefined; info: User | null; ws: WebSocket | undefined; }) {
    const [isExtended, setIsExtended] = useState(true);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [searchFound, setSearchFound] = useState<Activity[] | boolean>(false);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [newActivity, setNewActivity] = useState(false);
    const [titlesFuzzySet, setTitlesFuzzySet] = useState(FuzzySet());
    const [showPublishDate, setShowPublishDate] = useState(false);
    const [showExpirationDate, setShowExpirationDate] = useState(false);
    const [publishDate, setPublishDate] = useState<Date | undefined>(undefined);
    const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined);
    const [selectedEditActivity, setSelectedEditActivity] = useState<Activity | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');


    useEffect(() => {

        (async () => {
        if (await AsyncStorage.getItem("token") && await AsyncStorage.getItem("school")) {
            fetch(props.domain + '/activities', {
                headers: new Headers({
                    'Authorization': await AsyncStorage.getItem('token') ?? "",
                    'School': await AsyncStorage.getItem('school') ?? ""
                })
            })
                .then(res => res.json()).then(json => {
                    if (!json?.error) {
                        const activities = (json as Array<Activity>).sort((a, b) => b.date - a.date);
                        setActivities(activities);
                        activities.forEach(activity => {
                            setTitlesFuzzySet(titlesFuzzySet => {
                                titlesFuzzySet.add(activity.title);
                                return titlesFuzzySet;
                            });
                        });
                    } else {
                        setError(json.error);
                    }
                });
        }
    })();

    if (props.ws) {
        props.ws.addEventListener('message', (message: MessageEvent) => {
            if (message.data !== 'Ping!') {
                const data = JSON.parse(message.data);
                if (data.event === 'newActivity') {
                    setActivities(activities => {
                        let newActivities = [data, ...activities];
                        return newActivities;
                    });
                    setTitlesFuzzySet(titlesFuzzySet => {
                        titlesFuzzySet.add(data.title);
                        return titlesFuzzySet;
                    });
                } else if (data.event === 'editedActivity') {
                    setActivities(activities => {
                        let newActivities = [...activities];
                        newActivities[newActivities.findIndex(x => x.id === data.id)].title = data.newActivity.title;
                        newActivities[newActivities.findIndex(x => x.id === data.id)].description = data.newActivity.description;
                        newActivities[newActivities.findIndex(x => x.id === data.id)].title = data.newActivity.title;
                        newActivities[newActivities.findIndex(x => x.id === data.id)].type = data.newActivity.type;
                        newActivities[newActivities.findIndex(x => x.id === data.id)].delivery = data.newActivity.delivery;
                        newActivities[newActivities.findIndex(x => x.id === data.id)].expiration = data.newActivity.expiration;
                        newActivities[newActivities.findIndex(x => x.id === data.id)].receiver = data.newActivity.receiver;

                        return newActivities;
                    });
                    setTitlesFuzzySet(titlesFuzzySet => {
                        titlesFuzzySet.add(data.newActivity.title);
                        return titlesFuzzySet;
                    });
                } else if (data.event === 'deletedActivity') {
                    setActivities(activities => {
                        let newActivities = [...activities];
                        newActivities.splice(newActivities.findIndex(x => x.id === data.id), 1);
                        return newActivities;
                    });
                } else if (data.event === 'viewedActivity') {
                    if(data.user) {
                        setActivities(activities => {
                            let newActivities = [...activities];
                            (newActivities[newActivities.findIndex(x => x.id === data.id)].viewed as any)[data.user] = true;

                            return newActivities;
                        });
                } else {
                    setActivities(activities => {
                        let newActivities = [...activities];
                        newActivities[newActivities.findIndex(x => x.id === data.id)].viewed = true;

                        return newActivities;
                    });
                }
                } else if (data.event === 'deliveredActivity') {
                    setActivities(activities => {
                        let newActivities = [...activities];
                        (newActivities[newActivities.findIndex(x => x.id === data.id)].delivered as any)[data.user] = data.delivery;
                        (newActivities[newActivities.findIndex(x => x.id === data.id)].result as any)[data.user] = 'Unchecked';

                        return newActivities;
                    });
                } else if (data.event === 'resultActivity') {
                    if(data.user) {
                        setActivities(activities => {
                            let newActivities = [...activities];
                            (newActivities[newActivities.findIndex(x => x.id === data.id)].result as any)[data.user] = data.result;
    
                            return newActivities;
                        });
                    } else {
                    setActivities(activities => {
                        let newActivities = [...activities];
                        newActivities[newActivities.findIndex(x => x.id === data.id)].result = data.result;

                        return newActivities;
                    });
                }
                }
            }
        });
    }
    }, []);

    useEffect(() => {
        if (searchQuery || publishDate || expirationDate) {
            let found: string[] | undefined; 
            if(searchQuery) {
                found = titlesFuzzySet.get(searchQuery, null, .1)?.map(x => x[1]);
            } else {
                found = activities.map(x => x.title);
            }
            let activityLoadedPre: Activity[] = [];
            activities.forEach(activity => {
                const activityDate = new Date(activity.date);
                const activityExpiration = new Date(activity.expiration);
                if (found?.includes(activity.title) && (publishDate ? activityDate.getDate() === publishDate.getDate() && activityDate.getMonth() === publishDate.getMonth() && activityDate.getFullYear() === publishDate.getFullYear() : true) && (expirationDate ? activityExpiration.getDate() === expirationDate.getDate() && activityExpiration.getMonth() === expirationDate.getMonth() && activityExpiration.getFullYear() === expirationDate.getFullYear() : true)) {
                    activityLoadedPre.push(activity);
                }
            });
            setSearchFound(activityLoadedPre);
        } else {
            setSearchFound(false);
        }
}, [searchQuery, publishDate, expirationDate]);

    return (
        <View style={{ flex: 1 }}>
            <Portal>
            <MaxModal visible={!!selectedActivity} onDismiss={() => setSelectedActivity(null)}>
                <ReadActivity domain={props.domain} activities={activities} selectedActivity={selectedActivity} setSelectedActivity={setSelectedActivity} setSelectedEditActivity={setSelectedEditActivity} info={props.info}></ReadActivity>
            </MaxModal>
            <MaxModal visible={!!selectedEditActivity} dismissable={false}>
                <EditActivity domain={props.domain} setSelectedActivity={setSelectedActivity} selectedEditActivity={selectedEditActivity} setSelectedEditActivity={setSelectedEditActivity} info={props.info}></EditActivity>
            </MaxModal>
            <MaxModal visible={newActivity} onDismiss={() => setNewActivity(false)}>
                <NewActivity domain={props.domain} info={props.info} newActivity={newActivity} setNewActivity={setNewActivity}></NewActivity>
            </MaxModal>
            <Dialog visible={!!error} onDismiss={() => setError('')}>
            <Dialog.Title>Error</Dialog.Title>
            <Dialog.Content>
              <Paragraph>{error}</Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setError('')}>OK</Button>
            </Dialog.Actions>
          </Dialog>
            </Portal>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <DatePicker modal mode="date" open={showPublishDate} date={publishDate ?? new Date()} title="Select publish date" onConfirm={date => {
                setPublishDate(date);
                setShowPublishDate(false);
            }} onCancel={() => setShowPublishDate(false)} />
            <DatePicker modal mode="date" open={showExpirationDate} date={expirationDate ?? new Date()} title="Select expiration date" onConfirm={date => {
                setExpirationDate(date);
                setShowExpirationDate(false);
            }} onCancel={() => setShowExpirationDate(false)} />
            <IconButton icon={!publishDate ? 'calendar' : 'calendar-remove'} onPress={() => {
                if(!publishDate) {
                    setShowPublishDate(true);
                } else {
                    setPublishDate(undefined);
                }
             }} />
                <Searchbar placeholder="Search" onChangeText={text => setSearchQuery(text)} value={searchQuery} style={{ margin: 4, flex: 1 }} />
            <IconButton icon={!expirationDate ? 'calendar' : 'calendar-remove'} onPress={() => {
                if(!expirationDate) {
                    setShowExpirationDate(true);
                } else {
                    setExpirationDate(undefined);
                }
                }} />
            </View>
            {(Array.isArray(searchFound) ? searchFound : activities).length > 0 ? <FlatList data={Array.isArray(searchFound) ? searchFound : activities} keyExtractor={(item) => item.id} renderItem={({ item }) => <Card mode="outlined" style={{ margin: 4 }} onPress={() => setSelectedActivity(item)}>
        <Card.Title title={new Date(item.date).toString()} subtitle={new Date(item.expiration).toString()} />
        <Card.Content>
            <Title>{item.title}</Title>
            <Paragraph>{'Subject: ' + item.subject + ' by ' + item.author.name}</Paragraph>
            <Paragraph>{'Type: ' + item.type}</Paragraph>
            <Paragraph>{'Delivery: ' + item.delivery}</Paragraph>
            {props.info?.id !== item.author.id && !props.info?.administrator ?
            <View style={{ flexDirection: 'row' }}>
                <Chip style={{ marginTop: 8 }} icon={!item.result ? item.viewed ? 'eye' : 'eye-off' : item.result === 'Accepted' ? 'check' : 'cancel'}>{!item.result ? item.viewed ? 'Viewed' : 'Not viewed​' : item.result}</Chip>
            </View> : null}
            {item.files.length > 0 ? <IconButton icon="attachment" style={{ position: 'absolute', bottom: 4, right: 4 }}></IconButton> : null}
        </Card.Content>
    </Card>} onScroll={({ nativeEvent }) => {
    const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;

    setIsExtended(currentScrollPosition <= 0);
  }} /> : <Text style={{ padding: 24 }}>{!searchFound ? 'No activities!' : 'No activities found!'}</Text>}
            <AnimatedFAB icon="plus" label="New activity" extended={isExtended} style={{ position: 'absolute', bottom: 16, right: 16 }} onPress={() => setNewActivity(true)} />
        </View>
    );
  }