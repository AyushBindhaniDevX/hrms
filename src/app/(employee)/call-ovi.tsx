import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Send, Bot, Sparkles, User, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/context/TenantContext';
import { getAIResponse } from '@/lib/services/ai';
import { getEmployeeByProfileId } from '@/lib/services/employee';

interface Message {
  id: string;
  sender: 'ovi' | 'user';
  text: string;
  timestamp: string;
}

export default function CallOviScreen() {
  const router = useRouter();
  const colors = useTheme();
  const { profile } = useAuth();
  const { companyName, officeName } = useTenant();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ovi',
      text: `Hello ${profile?.full_name || 'there'}! I'm Ovi, your AI HR assistant for ${companyName}. How can I assist you with your leave, policies, or workplace questions today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const prompt = `You are Ovi, the smart HR and workplace assistant for ${companyName} (${officeName}).
Employee Name: ${profile?.full_name || 'Staff Member'}
User Question: "${userMsg.text}"

Provide a friendly, professional, concise response (2-4 sentences max).`;

      const res = await getAIResponse(prompt);
      const botReply = res.answer || "I'm looking into that for you. Please let me know if you need anything else!";

      const oviMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ovi',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, oviMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ovi',
          text: "I'm currently unable to connect to the assistant server. Please check your network or try again shortly.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header */}
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleRow}>
            <View style={[styles.botIconBadge, { backgroundColor: colors.primary + '20' }]}>
              <Bot size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Ovi AI Assistant</Text>
              <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
                {companyName} • {officeName}
              </Text>
            </View>
          </View>
        </View>

        {/* Message Stream */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((m) => {
            const isMe = m.sender === 'user';
            return (
              <View
                key={m.id}
                style={[
                  styles.bubbleRow,
                  isMe ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
                ]}
              >
                {!isMe && (
                  <View style={[styles.avatarBox, { backgroundColor: colors.primary + '18' }]}>
                    <Sparkles size={14} color={colors.primary} />
                  </View>
                )}
                <View
                  style={[
                    styles.bubble,
                    isMe
                      ? [styles.userBubble, { backgroundColor: colors.primary }]
                      : [styles.botBubble, { backgroundColor: colors.surface, borderColor: colors.border }],
                  ]}
                >
                  <Text style={[styles.msgText, { color: isMe ? '#FFFFFF' : colors.text }]}>
                    {m.text}
                  </Text>
                  <Text
                    style={[
                      styles.timestampText,
                      { color: isMe ? 'rgba(255,255,255,0.7)' : colors.textSecondary },
                    ]}
                  >
                    {m.timestamp}
                  </Text>
                </View>
              </View>
            );
          })}

          {isTyping && (
            <View style={[styles.bubbleRow, { justifyContent: 'flex-start' }]}>
              <View style={[styles.avatarBox, { backgroundColor: colors.primary + '18' }]}>
                <Sparkles size={14} color={colors.primary} />
              </View>
              <View style={[styles.bubble, styles.botBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Input Area */}
        <View style={[styles.inputRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            placeholder="Ask Ovi about leave, payroll, benefits..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: inputText.trim() ? colors.primary : colors.border },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isTyping}
          >
            <Send size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  botIconBadge: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 11,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 12,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  avatarBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  botBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  timestampText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 14,
    borderWidth: 1,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
