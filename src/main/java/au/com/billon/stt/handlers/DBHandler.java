package au.com.billon.stt.handlers;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.skife.jdbi.v2.DBI;
import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;

import java.io.StringWriter;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Created by Trevor Li on 7/14/15.
 */
public class DBHandler implements STTHandler {
    public DBHandler() { }

    public String invoke(String request, Map<String, String> details) throws Exception {
        DBI jdbi = new DBI(details.get("url"), details.get("username"), details.get("password"));
        Handle handle = jdbi.open();

        Query<Map<String, Object>> query = handle.createQuery(request);
        List<Map<String, Object>> results = query.list();

        ObjectMapper mapper = new ObjectMapper();

        StringWriter responseWriter = new StringWriter();

        mapper.writeValue(responseWriter, results);

        handle.close();

        return responseWriter.toString();
    }

    public List<String> getProperties() {
        String[] properties = {"url", "username", "password"};
        return Arrays.asList(properties);
    }
}