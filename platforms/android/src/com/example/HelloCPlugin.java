package com.example;

import org.apache.cordova.*;
import org.json.JSONArray;
import org.json.JSONException;
import android.app.Activity;
import android.os.Bundle;
import android.util.Log;

public class HelloCPlugin extends CordovaPlugin {

    protected static final String TAG = "HelloCPlugin";
    protected CallbackContext context;

    @Override
    public boolean execute(String action, JSONArray data, CallbackContext callbackContext) throws JSONException {
        context = callbackContext;
        boolean result = true;
        try {
            if (action.equals("hello")) {

                String input = data.getString(0);
                String jniOutput = HelloCJni.hello(input);
                String output = "Android says: " + jniOutput;
                callbackContext.success(output);

            } else if (action.equals("getArch")) {
                String jniOutput = HelloCJni.getArch();
                String output = "Android " + jniOutput;
                callbackContext.success(output);

            } else if (action.equals("calculate")) {
                int x = data.getInt(0);
                int y = data.getInt(1);
                int jniOutput = HelloCJni.calculate(x,y);
                callbackContext.success(jniOutput);
            }
            else {
                handleError("Invalid action");
                result = false;
            }
        } catch (Exception e) {
            handleException(e);
            result = false;
        }
        return result;
    }


    /**
     * Handles an error while executing a plugin API method.
     * Calls the registered Javascript plugin error handler callback.
     *
     * @param errorMsg Error message to pass to the JS error handler
     */
    private void handleError(String errorMsg) {
        try {
            Log.e(TAG, errorMsg);
            context.error(errorMsg);
        } catch (Exception e) {
            Log.e(TAG, e.toString());
        }
    }

    private void handleException(Exception exception) {
        handleError(exception.toString());
    }
}