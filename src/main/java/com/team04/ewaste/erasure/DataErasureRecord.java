package com.team04.ewaste.erasure;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "data_erasure_records")
@Getter
@Setter
public class DataErasureRecord {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID deviceId;

    @Column(nullable = false)
    private UUID ownerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DataErasureStatus status = DataErasureStatus.REQUESTED;

    @Column(nullable = false)
    private String erasureProvider = "Third-party recycler";

    private String certificateCode;

    @Column(length = 1000)
    private String staffNote;

    @Column(nullable = false)
    private Instant requestedAt = Instant.now();

    private Instant completedAt;
}
