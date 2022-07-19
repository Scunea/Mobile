import { useEffect, useState } from 'react';
import { View, ScrollView, useColorScheme } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Event, Activity, User } from './interfaces';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Portal, Dialog, Paragraph, Button, useTheme, Text } from 'react-native-paper';
import MaxModal from './MaxModal';
import ReadActivity from './ReadActivity';
import EditActivity from './EditActivity';

export default function Schedule(props: { domain: string | undefined; info: User | null; ws: WebSocket | undefined; }) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [selectedEditActivity, setSelectedEditActivity] = useState<Activity | null>(null);
    const [events, setEvents] = useState<any[]>([]);
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
                        setEvents(activities.map((activity, i) => {
                            if (activity.expiration) {
                                let returned = {
                                    id: i,
                                    activityId: activity.id,
                                    end: activity.expiration
                                };
                                return returned;
                            } else {
                                return {
                                    id: false
                                };
                            }
                        }).filter(x => typeof x.id !== 'boolean'));
                    } else {
                        setError(json.error);
                    }
                });
        }
    })();

    if (props.ws) {
        props.ws.addEventListener('message', (message: MessageEvent) => {
                const data = JSON.parse(message.data);
                if (data.event === 'newActivity') {
                    setActivities(activities => {
                        let newActivities = [data, ...activities];
                        return newActivities;
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
        });
    }
    }, []);

    const { colors } = useTheme();

    return (
        <>
        <Portal>
        <MaxModal visible={!!selectedActivity} onDismiss={() => setSelectedActivity(null)}>
            <ReadActivity domain={props.domain} activities={activities} selectedActivity={selectedActivity} setSelectedActivity={setSelectedActivity} setSelectedEditActivity={setSelectedEditActivity} info={props.info}></ReadActivity>
        </MaxModal>
        <MaxModal visible={!!selectedEditActivity} dismissable={false}>
                <EditActivity domain={props.domain} setSelectedActivity={setSelectedActivity} selectedEditActivity={selectedEditActivity} setSelectedEditActivity={setSelectedEditActivity} info={props.info}></EditActivity>
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
        <ScrollView>
        {<Calendar key={useColorScheme()} theme={{
            backgroundColor: colors.background,
            calendarBackground: colors.surface,
            arrowColor: colors.primary,
            textColor: colors.primary,
            monthTextColor: colors.primary,
            dayTextColor: colors.primary,
            todayTextColor: colors.tertiary,
            selectedDayBackgroundColor: colors.primary,
        }} markedDates={Object.fromEntries(events.map(x => {
            const dateEnd = new Date(x.end);
            return [[dateEnd.getFullYear().toString() + '-' + (dateEnd.getMonth() + 1).toString().padStart(2, '0') + '-' + dateEnd.getDate().toString().padStart(2, '0')], {
                selected: true
            }];
            }))} onDayPress={date => {
                const eventsR = events.filter(x => {
                    const dateThing = new Date(x.end);
                    return date.year === dateThing.getFullYear() && date.month === (dateThing.getMonth() + 1) && date.day === dateThing.getDate();
                });
                if(eventsR.length > 0) {
                    setSelectedEvents(eventsR);
                }
            }} />}
            {selectedEvents.length > 0 ? <View style={{ padding: 24 }}>
                <Text variant="titleMedium">{new Date(selectedEvents[0]?.end ?? 0).toDateString()}</Text>
                {activities.filter(x => selectedEvents.find(y => y.activityId === x.id)).map(activity => <Button key={activity.id} icon="pencil" onPress={() => setSelectedActivity(activity)}>{activity.title}</Button>)}
            </View> : null}
            </ScrollView>
            </>
    );
  }