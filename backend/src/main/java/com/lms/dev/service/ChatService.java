package com.lms.dev.service;

import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
public class ChatService {

    public Map<String, String> processMessage(String userMessage) {
        String reply = "I'm still learning, but I can help you with course navigation!";
        String msg = userMessage.toLowerCase();

        if (msg.contains("hello") || msg.contains("hi")) {
            reply = "Hello! 👋 Welcome to our learning platform. How can I assist you today?";
        } else if (msg.contains("course") || msg.contains("learn")) {
            reply = "You can explore all our courses in the 'Courses' section. We have great content on Java, React, and more!";
        } else if (msg.contains("certificate")) {
            reply = "Great question! Once you complete 100% of a course, you can download your certificate directly from the course page.";
        } else if (msg.contains("admin")) {
            reply = "If you are an admin, please log in with your credentials to access the Dashboard.";
        } else if (msg.contains("help")) {
            reply = "I can help with: \n- Finding courses\n- Certificate information\n- Account navigation\nJust ask!";
        }

        Map<String, String> response = new HashMap<>();
        response.put("reply", reply);
        return response;
    }
}
