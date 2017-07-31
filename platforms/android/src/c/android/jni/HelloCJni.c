//
//  HelloCJni
//
#include <string.h>
#include <jni.h>
#include <hello.h>

// Platform-specific C implementation to get current CPU architecture
jstring
Java_com_example_HelloCJni_getArch( JNIEnv* env, jobject thiz )
{
#if defined(__arm__)
  #if defined(__ARM_ARCH_7A__)
    #if defined(__ARM_NEON__)
      #if defined(__ARM_PCS_VFP)
        #define ABI "armeabi-v7a/NEON (hard-float)"
      #else
        #define ABI "armeabi-v7a/NEON"
      #endif
    #else
      #if defined(__ARM_PCS_VFP)
        #define ABI "armeabi-v7a (hard-float)"
      #else
        #define ABI "armeabi-v7a"
      #endif
    #endif
  #else
   #define ABI "armeabi"
  #endif
#elif defined(__i386__)
   #define ABI "x86"
#elif defined(__x86_64__)
   #define ABI "x86_64"
#elif defined(__mips64)  /* mips64el-* toolchain defines __mips__ too */
   #define ABI "mips64"
#elif defined(__mips__)
   #define ABI "mips"
#elif defined(__aarch64__)
   #define ABI "arm64-v8a"
#else
   #define ABI "unknown"
#endif
    return (*env)->NewStringUTF(env, ABI);
}

// Android JNI wrapper for cross-platform C implementation
jstring
Java_com_example_HelloCJni_hello( JNIEnv* env, jobject thiz, jstring j_input)
{
    // Call the cross-platform shared C function
    char* c_input = strdup((*env)->GetStringUTFChars(env, j_input, 0));
    char* output = c_hello(c_input);
    return (*env)->NewStringUTF(env, output);
}

// Android JNI wrapper for cross-platform C library
jstring
Java_com_example_HelloCJni_calculate( JNIEnv* env, jobject thiz, jint j_x, jint j_y)
{
    // Call the cross-platform shared C function
    int x = (int) j_x;
    int y = (int) j_y;
    int result = calculate(x, y);
    return result;
}