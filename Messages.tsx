import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import FuzzySet from 'fuzzyset';
import { AnimatedFAB, Card, Paragraph, Title, Portal, Text, Button, Dialog, IconButton, Searchbar } from 'react-native-paper';
import DatePicker from 'react-native-date-picker'
import MaxModal from './MaxModal';
import ReadMessage from './ReadMessage';
import EditMessage from './EditMessage';
import NewMessage from './NewMessage';
import { Message, User } from './interfaces';

export default function Messages(props: { domain: string | undefined; info: User | null; ws: WebSocket | undefined; }) {
    const [isExtended, setIsExtended] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [searchFound, setSearchFound] = useState<Message[] | boolean>(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [newMessage, setNewMessage] = useState(false);
    const [titlesFuzzySet, setTitlesFuzzySet] = useState(FuzzySet());
    const [showDate, setShowDate] = useState(false);
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [selectedEditMessage, setSelectedEditMessage] = useState<Message | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');


    useEffect(() => {

        (async () => {
        if (await AsyncStorage.getItem("token") && await AsyncStorage.getItem("school")) {
            fetch(props.domain + '/messages', {
                headers: new Headers({
                    'Authorization': await AsyncStorage.getItem('token') ?? "",
                    'School': await AsyncStorage.getItem('school') ?? ""
                })
            })
                .then(res => res.json()).then(json => {
                    if (!json?.error) {
                        const messages = (json as Array<Message>).sort((a, b) => b.date - a.date);
                        setMessages(messages);
                        messages.forEach(message => {
                            setTitlesFuzzySet(titlesFuzzySet => {
                                titlesFuzzySet.add(message.title);
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
                    const data = JSON.parse(message.data);
                    if (data.event === 'newMessage') {
                        setMessages(messages => {
                            let newMessages = [data, ...messages];
                            return newMessages;
                        });
                        setTitlesFuzzySet(titlesFuzzySet => {
                            titlesFuzzySet.add(data.title);
                            return titlesFuzzySet;
                        });
                    } else if (data.event === 'editedMessage') {
                        setMessages(messages => {
                            let newMessages = [...messages];
                            newMessages[newMessages.findIndex(x => x.id === data.id)].title = data.message.title;
                            newMessages[newMessages.findIndex(x => x.id === data.id)].content = data.message.content;
                            newMessages[newMessages.findIndex(x => x.id === data.id)].files = data.message.files;
                            newMessages[newMessages.findIndex(x => x.id === data.id)].receiver = data.message.receiver;
                            return newMessages;
                        });
                        setTitlesFuzzySet(titlesFuzzySet => {
                            titlesFuzzySet.add(data.message.title);
                            return titlesFuzzySet;
                        });
                    } else if (data.event === 'deletedMessage') {
                        setMessages(messages => {
                            let newMessages = [...messages];
                            newMessages.splice(newMessages.findIndex(x => x.id === data.id), 1);
                            return newMessages;
                        });
                    }
            });
        }
    }, []);

    useEffect(() => {
        if (searchQuery || date) {
            let found: string[] | undefined; 
            if(searchQuery) {
                found = titlesFuzzySet.get(searchQuery, null, .1)?.map(x => x[1]);
            } else {
                found = messages.map(x => x.title);
            }
            let messageLoadedPre: Message[] = [];
            messages.forEach(message => {
                const messageDate = new Date(message.date);
                if (found?.includes(message.title) && (date ? messageDate.getDate() === date.getDate() && messageDate.getMonth() === date.getMonth() && messageDate.getFullYear() === date.getFullYear() : true)) {
                    messageLoadedPre.push(message);
                }
            });
            setSearchFound(messageLoadedPre);
        } else {
            setSearchFound(false);
        }
}, [searchQuery, date]);

    return (
        <View style={{ flex: 1 }}>
            <Portal>
            <MaxModal visible={!!selectedMessage} onDismiss={() => setSelectedMessage(null)}>
                <ReadMessage domain={props.domain} messages={messages} selectedMessage={selectedMessage} setSelectedMessage={setSelectedMessage} setSelectedEditMessage={setSelectedEditMessage} info={props.info}></ReadMessage>
            </MaxModal>
            <MaxModal visible={!!selectedEditMessage} dismissable={false}>
                <EditMessage domain={props.domain} setSelectedMessage={setSelectedMessage} selectedEditMessage={selectedEditMessage} setSelectedEditMessage={setSelectedEditMessage} info={props.info}></EditMessage>
            </MaxModal>
            <MaxModal visible={newMessage} onDismiss={() => setNewMessage(false)}>
                <NewMessage domain={props.domain} info={props.info} newMessage={newMessage} setNewMessage={setNewMessage}></NewMessage>
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
            {(Array.isArray(searchFound) ? searchFound : messages).length > 0 ? <FlatList data={Array.isArray(searchFound) ? searchFound : messages} keyExtractor={(item) => item.id} renderItem={({ item }) => <Card mode="outlined" style={{ margin: 4 }} onPress={() => setSelectedMessage(item)}>
        <Card.Title title={item.receiver ? 'From ' + item.author.name + ' to ' + item.receiver.map(x => x.name).join(', ') : 'From ' + item.author.name} subtitle={new Date(item.date).toString()} />
        <Card.Content>
            <Title>{item.title}</Title>
            <Paragraph style={{ maxHeight: 100 }}>{item.preview ?? 'Preview not available.'}</Paragraph>
            {item.files.length > 0 ? <IconButton icon="attachment" style={{ position: 'absolute', bottom: 4, right: 4 }}></IconButton> : null}
        </Card.Content>
    </Card>} onScroll={({ nativeEvent }) => {
    const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;

    setIsExtended(currentScrollPosition <= 0);
  }} /> : <Text style={{ padding: 24 }}>{!searchFound ? 'No messages!' : 'No messages found!'}</Text>}
            <AnimatedFAB icon="plus" label="New message" extended={isExtended} style={{ position: 'absolute', bottom: 16, right: 16 }} onPress={() => setNewMessage(true)} />
        </View>
    );
  }