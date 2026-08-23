import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { PhoneOff } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { useAuth } from '@/hooks/useAuth';
import { getEmployeeByProfileId } from '@/lib/services/employee';
import { applyLeave, getLeaveTypes } from '@/lib/services/leave';
import { createTicket } from '@/lib/services/helpdesk';

const BASE_AGENT_URL = 'https://elevenlabs.io/app/talk-to?agent_id=agent_2901m0q73yb8ej3asxjysw74styg&branch_id=agtbrch_8201m0q73zvhfgb8x4gmdxt24bjv';

export default function CallOviScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [employee, setEmployee] = useState<any>(null);
  const [agentUrl, setAgentUrl] = useState<string | null>(null);
  
  const webviewRef = useRef<WebView>(null);

  useEffect(() => {
    const loadContext = async () => {
      if (profile) {
        const emp = await getEmployeeByProfileId(profile.id);
        setEmployee(emp);
        const name = encodeURIComponent(profile.full_name || 'Employee');
        const dept = encodeURIComponent(emp?.department?.name || 'Unknown');
        const role = encodeURIComponent(emp?.designation || 'Staff');
        
        const urlWithContext = `${BASE_AGENT_URL}&var_name=${name}&var_department=${dept}&var_role=${role}`;
        setAgentUrl(urlWithContext);
      } else {
        setAgentUrl(BASE_AGENT_URL);
      }
    };
    loadContext();
  }, [profile]);

  // INJECTED JAVASCRIPT: Listens to ElevenLabs Client Tools
  const injectedJS = `
    document.addEventListener("DOMContentLoaded", () => {
      const widget = document.querySelector("elevenlabs-convai");
      
      if (widget) {
        widget.addEventListener("elevenlabs-convai:call", (event) => {
          
          const createTool = (toolName) => {
            return async (args) => {
              return new Promise((resolve, reject) => {
                const reqId = Math.random().toString();
                
                // Send the tool call request to React Native
                window.ReactNativeWebView.postMessage(JSON.stringify({ 
                  type: 'TOOL_CALL', 
                  tool: toolName, 
                  args, 
                  reqId 
                }));
                
                // Listen for the result from React Native
                const listener = (e) => {
                  try {
                    const data = JSON.parse(e.data);
                    if (data.type === 'TOOL_RESULT' && data.reqId === reqId) {
                      window.removeEventListener('message', listener);
                      document.removeEventListener('message', listener);
                      if (data.error) reject(data.error);
                      else resolve(data.result);
                    }
                  } catch (err) {}
                };
                
                // React Native WebView uses document or window depending on the platform for return messages
                document.addEventListener('message', listener);
                window.addEventListener('message', listener);
              });
            };
          };

          // Register our three tools
          event.detail.config.clientTools = {
            apply_for_leave: createTool('apply_for_leave'),
            create_helpdesk_ticket: createTool('create_helpdesk_ticket'),
            regularize_attendance: createTool('regularize_attendance')
          };
          
        });
      }
    });
    true;
  `;

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'TOOL_CALL' && employee) {
        const { tool, args, reqId } = data;
        let result = null;

        try {
          if (tool === 'apply_for_leave') {
            const types = await getLeaveTypes();
            const typeName = args.leave_type || 'Annual Leave';
            const matchedType = types.find(x => x.name.toLowerCase().includes(typeName.toLowerCase())) || types[0];
            
            // Calculate days roughly
            const start = new Date(args.start_date);
            const end = new Date(args.end_date);
            const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);

            result = await applyLeave({
              employee_id: employee.id,
              leave_type_id: matchedType.id,
              start_date: args.start_date,
              end_date: args.end_date,
              days: days,
              is_half_day: false,
              reason: args.reason || 'Requested via Ovi AI'
            });
          } 
          else if (tool === 'create_helpdesk_ticket') {
            result = await createTicket({
              employee_id: employee.id,
              category: (args.category || 'other').toLowerCase() as any,
              title: args.title,
              description: args.description,
              priority: 'medium'
            });
          }
          else if (tool === 'regularize_attendance') {
            // We use the helpdesk system for attendance regularization
            result = await createTicket({
              employee_id: employee.id,
              category: 'hr',
              title: \`Attendance Regularization: \${args.date}\`,
              description: args.reason,
              priority: 'medium'
            });
          }

          // Return success
          webviewRef.current?.injectJavaScript(\`
            window.postMessage(JSON.stringify({ type: 'TOOL_RESULT', reqId: '\${reqId}', result: \${JSON.stringify(result || { success: true })} }), '*');
            true;
          \`);

        } catch (e: any) {
          // Return error
          webviewRef.current?.injectJavaScript(\`
            window.postMessage(JSON.stringify({ type: 'TOOL_RESULT', reqId: '\${reqId}', error: '\${e.message}' }), '*');
            true;
          \`);
        }
      }
    } catch (e) {
      console.error("Message parsing error:", e);
    }
  };

  if (!agentUrl) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0D7377" />
        <Text style={{ color: '#94A3B8', marginTop: 16 }}>Loading Secure Channel...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.encryptedText}>🔒 End-to-end encrypted AI Call</Text>
      </View>

      <View style={styles.webviewContainer}>
        <WebView 
          ref={webviewRef}
          source={{ uri: agentUrl }}
          style={styles.webview}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          geolocationEnabled={true}
          mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
          injectedJavaScript={injectedJS}
          onMessage={handleMessage}
        />
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.endCallRow}>
          <TouchableOpacity 
            style={styles.endCallBtn} 
            onPress={() => router.back()}
          >
            <PhoneOff color="#FFF" size={32} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  encryptedText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  webviewContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 120, 
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  endCallRow: {
    alignItems: 'center',
  },
  endCallBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
});
