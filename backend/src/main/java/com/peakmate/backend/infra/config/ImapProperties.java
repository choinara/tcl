package com.peakmate.backend.infra.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@ConfigurationProperties(prefix = "app.email.imap")
public class ImapProperties {

    private long pollIntervalMs = 300000;
    private List<AccountConfig> accounts = new ArrayList<>();

    public long getPollIntervalMs() { return pollIntervalMs; }
    public void setPollIntervalMs(long pollIntervalMs) { this.pollIntervalMs = pollIntervalMs; }

    public List<AccountConfig> getAccounts() { return accounts; }
    public void setAccounts(List<AccountConfig> accounts) { this.accounts = accounts; }

    public static class AccountConfig {
        private String host = "";
        private int port = 993;
        private String username = "";
        private String password = "";
        private boolean ssl = true;
        private String folder = "INBOX";

        public String getHost() { return host; }
        public void setHost(String host) { this.host = host; }

        public int getPort() { return port; }
        public void setPort(int port) { this.port = port; }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public boolean isSsl() { return ssl; }
        public void setSsl(boolean ssl) { this.ssl = ssl; }

        public String getFolder() { return folder; }
        public void setFolder(String folder) { this.folder = folder; }

        public boolean isConfigured() {
            return host != null && !host.isBlank()
                    && username != null && !username.isBlank()
                    && password != null && !password.isBlank();
        }
    }
}
