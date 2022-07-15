import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { View, FlatList, Linking } from 'react-native';
import FuzzySet from 'fuzzyset';
import { AnimatedFAB, Card, Paragraph, Title, Portal, Text, Button, Dialog, IconButton, TextInput, Searchbar } from 'react-native-paper';
import DatePicker from 'react-native-date-picker'
import MaxModal from './MaxModal';
import NewReport from './NewReport';
import { Report, User } from './interfaces';

export default function Reports(props: { domain: string | undefined; info: User | null; ws: WebSocket | undefined; }) {
    const [isExtended, setIsExtended] = useState(true);
    const [reports, setReports] = useState<Report[]>([]);
    const [searchFound, setSearchFound] = useState<Report[] | boolean>(false);
    const [newReport, setNewReport] = useState(false);
    const [titlesFuzzySet, setTitlesFuzzySet] = useState(FuzzySet());
    const [showDate, setShowDate] = useState(false);
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [showDeleteDialog, setShowDeleteDialog] = useState('');
    const [showEditDialog, setShowEditDialog] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
        if (await AsyncStorage.getItem("token") && await AsyncStorage.getItem("school")) {
            fetch(props.domain + '/reports', {
                headers: new Headers({
                    'Authorization': await AsyncStorage.getItem('token') ?? "",
                    'School': await AsyncStorage.getItem('school') ?? ""
                })
            })
                .then(res => res.json()).then(json => {
                    if (!json?.error) {
                        const reports = (json as Array<Report>).sort((a, b) => b.date - a.date);
                        setReports(reports);
                        reports.forEach(report => {
                            setTitlesFuzzySet(titlesFuzzySet => {
                                titlesFuzzySet.add(report.title);
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
                    if (data.event === 'newReport') {
                        setReports(reports => {
                            let newReports = [data, ...reports];
                            return newReports;
                        });
                        setTitlesFuzzySet(titlesFuzzySet => {
                            titlesFuzzySet.add(data.title);
                            return titlesFuzzySet;
                        });
                    } else if (data.event === 'editedReport') {
                        setReports(reports => {
                            let newReports = [...reports];
                            newReports[newReports.findIndex(x => x.id === data.id)].title = data.newTitle;
                            return newReports;
                        });
                        setTitlesFuzzySet(titlesFuzzySet => {
                            titlesFuzzySet.add(data.newTitle);
                            return titlesFuzzySet;
                        });
                    } else if (data.event === 'deletedReport') {
                        setReports(reports => {
                            let newReports = [...reports];
                            newReports.splice(newReports.findIndex(x => x.id === data.id), 1);
                            return newReports;
                        });
                    }
                }
            });
        }
    }, []);

    useEffect(() => {
        if(showEditDialog) {
            setNewTitle(reports.find(x => x.id === showEditDialog)?.title ?? '');
        } else {
            setNewTitle('');
        }
    }, [showEditDialog]);

    useEffect(() => {
        if (searchQuery || date) {
            let found: string[] | undefined; 
            if(searchQuery) {
                found = titlesFuzzySet.get(searchQuery, null, .1)?.map(x => x[1]);
            } else {
                found = reports.map(x => x.title);
            }
            let reportLoadedPre: Report[] = [];
            reports.forEach(report => {
                const reportDate = new Date(report.date);
                if (found?.includes(report.title) && (date ? reportDate.getDate() === date.getDate() && reportDate.getMonth() === date.getMonth() && reportDate.getFullYear() === date.getFullYear() : true)) {
                    reportLoadedPre.push(report);
                }
            });
            setSearchFound(reportLoadedPre);
        } else {
            setSearchFound(false);
        }
}, [searchQuery, date]);

    return (
        <View style={{ flex: 1 }}>
            <Portal>
            <MaxModal visible={newReport} onDismiss={() => setNewReport(false)}>
                <NewReport domain={props.domain} info={props.info} newReport={newReport} setNewReport={setNewReport}></NewReport>
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

          <Dialog visible={!!showDeleteDialog} onDismiss={() => setShowDeleteDialog('')}>
            <Dialog.Title>Delete report?</Dialog.Title>
            <Dialog.Content>
              <Paragraph>Do you want to delete this report?</Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowDeleteDialog('')}>Cancel</Button>
            <Button onPress={async () => {
                fetch(props.domain + '/reports/' + showDeleteDialog, {
                    method: 'DELETE',
                    headers: new Headers({
                        'Authorization': await AsyncStorage.getItem('token') ?? "",
                        'School': await AsyncStorage.getItem('school') ?? ""
                    })
                }).then(res => res.json()).then(json => {
                    setShowDeleteDialog('');
                    if (json?.error) {
                        setError(json.error);
                    }
                });
            }}>Delete</Button>
            </Dialog.Actions>
          </Dialog>

          <Dialog visible={!!showEditDialog} onDismiss={() => setShowEditDialog('')}>
            <Dialog.Title>Edit report's title</Dialog.Title>
            <Dialog.Content>
              <TextInput value={newTitle} onChangeText={text => setNewTitle(text)} />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowEditDialog('')}>Cancel</Button>
            <Button onPress={async () => {
                fetch(props.domain + '/reports/' + showEditDialog, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        title: newTitle
                    }),
                    headers: new Headers({
                        'Authorization': await AsyncStorage.getItem('token') ?? "",
                        'School': await AsyncStorage.getItem('school') ?? "",
                        'Content-Type': 'application/json'
                    })
                }).then(res => res.json()).then(json => {
                    setShowEditDialog('');
                    if (json?.error) {
                        setError(json.error);
                    }
                });
            }}>Save</Button>
            </Dialog.Actions>
          </Dialog>
            </Portal>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <DatePicker modal mode="date" open={showDate} date={date ?? new Date()} onConfirm={date => {
                setDate(date);
                setShowDate(false);
            }} onCancel={() => setShowDate(false)} />
                <Searchbar placeholder="Search" onChangeText={text => setSearchQuery(text)} value={searchQuery} style={{ margin: 4, flex: 1 }} />
                <IconButton icon={!date ? 'calendar' : 'calendar-remove'} onPress={() => {
                    if(!date) {
                        setShowDate(true);
                    } else {
                        setDate(undefined);
                    }
                    }} />
            </View>
            {(Array.isArray(searchFound) ? searchFound : reports).length > 0 ? <FlatList data={Array.isArray(searchFound) ? searchFound : reports} keyExtractor={(item) => item.id} renderItem={({ item }) => <Card mode="outlined" style={{ margin: 4 }}>
                <Card.Title title={'From ' + item.author.name} />
        <Card.Content>
            <Title>{item.title}</Title>
            <View style={{ flexDirection: 'row', position: 'absolute', bottom: 4, right: 4 }} >
                {item.author.id === props.info?.id ? <>
                    <IconButton icon="delete" onPress={() => setShowDeleteDialog(item.id)} />
                    <IconButton icon="pencil" onPress={() => setShowEditDialog(item.id)} />
                </> : null}
                <IconButton icon="download" onPress={() => Linking.openURL(props.domain + '/static/' + item.file.id + '?name=' + item.file.name)} />
            </View>
        </Card.Content>
    </Card>} onScroll={({ nativeEvent }) => {
    const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;

    setIsExtended(currentScrollPosition <= 0);
  }} /> : <Text style={{ padding: 24 }}>{!searchFound ? 'No reports!' : 'No reports found!'}</Text>}
            <AnimatedFAB icon="plus" label="New report" extended={isExtended} style={{ position: 'absolute', bottom: 16, right: 16 }} onPress={() => setNewReport(true)} />
        </View>
    );
  }