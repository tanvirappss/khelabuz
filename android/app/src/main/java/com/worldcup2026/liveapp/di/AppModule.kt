package com.worldcup2026.liveapp.di

import com.worldcup2026.liveapp.data.remote.SupabaseConfig
import com.worldcup2026.liveapp.data.remote.SupabaseService
import com.worldcup2026.liveapp.data.repository.MatchRepositoryImpl
import com.worldcup2026.liveapp.domain.repository.MatchRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        val interceptor = Interceptor { chain ->
            val original = chain.request()
            val requestBuilder = original.newBuilder()
                .header("apikey", SupabaseConfig.SUPABASE_ANON_KEY)
                .header("Authorization", "Bearer ${SupabaseConfig.SUPABASE_ANON_KEY}")
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
            val request = requestBuilder.build()
            chain.proceed(request)
        }

        return OkHttpClient.Builder()
            .addInterceptor(interceptor)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideSupabaseService(okHttpClient: OkHttpClient): SupabaseService {
        // Fallback placeholder URL for local preview validation if config is blank
        val baseUrl = if (SupabaseConfig.isMockEnabled()) {
            "http://127.0.0.1/" // dummy local URL
        } else {
            SupabaseConfig.SUPABASE_URL.let { url ->
                if (url.endsWith("/")) url else "$url/"
            }
        }

        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(SupabaseService::class.java)
    }

    @Provides
    @Singleton
    fun provideMatchRepository(supabaseService: SupabaseService): MatchRepository {
        return MatchRepositoryImpl(supabaseService)
    }
}
